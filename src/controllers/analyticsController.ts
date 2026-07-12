import { Request, Response } from 'express';
import { supabase } from '../config/supabase.js';
import { redisClient } from '../config/redis.js';

export const getNeighborhoodMetrics = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const cacheKey = `analytics:neighborhood:${id}`;

    // 1. CACHE READ: Check Redis first
    const cachedData = await redisClient.get(cacheKey);
    
    if (cachedData) {
      // Cache Hit: Return blazing fast response
      res.status(200).json({
        status: 'success',
        source: 'cache',
        data: JSON.parse(cachedData)
      });
      return;
    }

    // 2. CACHE MISS: Query the primary database (Supabase)
    const { data: neighborhood, error: nbhdError } = await supabase
      .from('neighborhoods')
      .select('*, properties(price, cap_rate, yield)')
      .eq('id', id)
      .single();

    if (nbhdError) {
      console.error("SUPABASE ERROR:", nbhdError);
    }

    if (nbhdError || !neighborhood) {
      res.status(404).json({ status: 'error', message: 'Neighborhood not found' });
      return;
    }

    // 3. PROCESS: Calculate analytical metrics on the fly
    const properties = neighborhood.properties || [];
    const totalProperties = properties.length;
    
    const avgCapRate = totalProperties 
      ? properties.reduce((sum: number, p: any) => sum + (Number(p.cap_rate) || 0), 0) / totalProperties 
      : 0;

    const avgPrice = totalProperties 
      ? properties.reduce((sum: number, p: any) => sum + (Number(p.price) || 0), 0) / totalProperties 
      : 0;

    const analyticsPayload = {
      neighborhood_id: neighborhood.id,
      name: neighborhood.name,
      demographics: neighborhood.demographics,
      metrics: {
        total_tracked_properties: totalProperties,
        average_cap_rate: avgCapRate.toFixed(2),
        average_price: avgPrice.toFixed(2)
      }
    };

    // 4. CACHE WRITE: Store the result in Redis for 1 hour
    await redisClient.setEx(cacheKey, 3600, JSON.stringify(analyticsPayload));

    // 5. LIVE DATA STREAM: Broadcast the fresh analytics to any live WebSocket subscribers
    const io = req.app.get('io');
    if (io) {
      io.to(`neighborhood:${id}`).emit('live_metrics_update', {
        source: 'database_refresh',
        timestamp: new Date().toISOString(),
        data: analyticsPayload
      });
    }

    // 6. RESPOND
    res.status(200).json({
      status: 'success',
      source: 'database',
      data: analyticsPayload
    });

  } catch (error) {
    console.error('Analytics Error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch analytics' });
  }
};