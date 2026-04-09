const express = require('express');
const mongoose = require('mongoose');
const os = require('os');
const { exec } = require('child_process');
const router = express.Router();

// GET database stats
router.get('/db-stats', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    
    // ✅ FIX: Use db.command instead of db.stats() for modern MongoDB versions
    const stats = await db.command({ dbStats: 1 });
    
    res.json({
      dataSize: {
        bytes: stats.dataSize || 0,
        mb: ((stats.dataSize || 0) / 1024 / 1024).toFixed(2),
        gb: ((stats.dataSize || 0) / 1024 / 1024 / 1024).toFixed(2)
      },
      storageSize: {
        bytes: stats.storageSize || 0,
        mb: ((stats.storageSize || 0) / 1024 / 1024).toFixed(2),
        gb: ((stats.storageSize || 0) / 1024 / 1024 / 1024).toFixed(2)
      },
      collections: stats.collections || 0,
      indexes: stats.indexes || 0,
      avgObjSize: stats.avgObjSize || 0,
      status: 'connected'
    });
  } catch (error) {
    res.status(500).json({ error: error.message, status: 'disconnected' });
  }
});

// GET collection sizes
router.get('/collection-sizes', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    const collectionStats = {};
    
    for (const collection of collections) {
      // ✅ FIX: Use db.command({ collStats: name }) instead of collection.stats()
      const stats = await db.command({ collStats: collection.name });
      
      collectionStats[collection.name] = {
        count: stats.count || 0,
        size: {
          bytes: stats.size || 0,
          mb: ((stats.size || 0) / 1024 / 1024).toFixed(2)
        },
        avgSize: stats.avgObjSize || 0
      };
    }
    
    res.json(collectionStats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper Function: Get Hard Drive Space (C: Drive)
const getDiskSpace = () => {
  return new Promise((resolve) => {
    if (os.platform() === 'win32') {
      exec('wmic logicaldisk get size,freespace,caption', (error, stdout) => {
        if (error) return resolve(null);
        try {
          const lines = stdout.trim().split('\n').slice(1);
          let total = 0, free = 0;
          lines.forEach(line => {
            const parts = line.trim().split(/\s+/);
            if (parts.length >= 3 && parts[0].includes('C:')) {
              free = parseInt(parts[1], 10);
              total = parseInt(parts[2], 10);
            }
          });
          if (total > 0) {
            resolve({
              totalGB: (total / (1024 * 1024 * 1024)).toFixed(2),
              freeGB: (free / (1024 * 1024 * 1024)).toFixed(2),
              usedGB: ((total - free) / (1024 * 1024 * 1024)).toFixed(2),
              percentUsed: (((total - free) / total) * 100).toFixed(1)
            });
          } else {
            resolve(null);
          }
        } catch (e) {
          resolve(null);
        }
      });
    } else {
      resolve(null);
    }
  });
};

// GET system memory and Disk info
router.get('/system-info', async (req, res) => {
  try {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const usagePercent = ((usedMemory / totalMemory) * 100).toFixed(1);
    
    const diskInfo = await getDiskSpace(); 
    
    res.json({
      totalMemory: { mb: (totalMemory / 1024 / 1024).toFixed(2), gb: (totalMemory / 1024 / 1024 / 1024).toFixed(2) },
      usedMemory: { mb: (usedMemory / 1024 / 1024).toFixed(2), gb: (usedMemory / 1024 / 1024 / 1024).toFixed(2) },
      freeMemory: { mb: (freeMemory / 1024 / 1024).toFixed(2), gb: (freeMemory / 1024 / 1024 / 1024).toFixed(2) },
      usagePercent: usagePercent,
      disk: diskInfo,
      arch: os.arch(),
      platform: os.platform()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// MANUAL: Cleanup old reports
router.post('/cleanup-old-reports', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const result = await db.collection('reports').deleteMany({
      createdAt: { $lt: thirtyDaysAgo }
    });
    
    res.json({
      message: `Deleted ${result.deletedCount} old reports`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;