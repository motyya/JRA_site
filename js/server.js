const { Pool } = require('pg');
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const rootDir = __dirname;

app.use('/pages', express.static(path.join(rootDir, '../pages')));
app.use('/css', express.static(path.join(rootDir, '../css')));
app.use('/js', express.static(path.join(rootDir, '../js')));
app.use('/images', express.static(path.join(rootDir, '../images')));

// ========== НАСТРОЙКА ПУЛА СОЕДИНЕНИЙ С БАЗОЙ ==========
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
    maxLifetimeMillis: 1800000,
});

// Проверка подключения при старте
pool.query('SELECT NOW()', (err) => {
    if (err) {
        console.error('Database connection failed on startup:', err.message);
    } else {
        console.log('Database connection pool is ready');
    }
});

const query = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        pool.query(sql, params, (err, results) => {
            if (err) {
                console.error('Database error:', err.message);
                reject({ error: 'Database error', details: err.message });
                return;
            }
            resolve(results.rows);
        });
    });
};

// ===================== API ROUTES ======================

// Лошади
app.get('/api/horses', async (req, res) => {
    try {
        const { search, birth_year_from, birth_year_to, death_year_from, death_year_to,
                races_from, races_to, wins_from, wins_to, losses_from, losses_to,
                triple_crown, tiara_crown } = req.query;

        let sql = 'SELECT * FROM horses WHERE 1=1';
        const params = [];
        let paramCount = 1;

        if (search) {
            sql += ` AND name LIKE $${paramCount}`;
            params.push(`%${search}%`);
            paramCount++;
        }

        if (birth_year_from) {
            sql += ` AND birth_year >= $${paramCount}`;
            params.push(birth_year_from);
            paramCount++;
        }
        if (birth_year_to) {
            sql += ` AND birth_year <= $${paramCount}`;
            params.push(birth_year_to);
            paramCount++;
        }

        if (death_year_from) {
            sql += ` AND death_year >= $${paramCount}`;
            params.push(death_year_from);
            paramCount++;
        }
        if (death_year_to) {
            sql += ` AND death_year <= $${paramCount}`;
            params.push(death_year_to);
            paramCount++;
        }

        if (races_from) {
            sql += ` AND total_races >= $${paramCount}`;
            params.push(races_from);
            paramCount++;
        }
        if (races_to) {
            sql += ` AND total_races <= $${paramCount}`;
            params.push(races_to);
            paramCount++;
        }

        if (wins_from) {
            sql += ` AND total_wins >= $${paramCount}`;
            params.push(wins_from);
            paramCount++;
        }
        if (wins_to) {
            sql += ` AND total_wins <= $${paramCount}`;
            params.push(wins_to);
            paramCount++;
        }

        if (losses_from) {
            sql += ` AND total_losses >= $${paramCount}`;
            params.push(losses_from);
            paramCount++;
        }
        if (losses_to) {
            sql += ` AND total_losses <= $${paramCount}`;
            params.push(losses_to);
            paramCount++;
        }

        if (triple_crown === 'true') sql += ' AND triple_crown = TRUE';
        if (tiara_crown === 'true') sql += ' AND tiara_crown = TRUE';

        sql += ' ORDER BY name';

        const results = await query(sql, params);
        res.json(results);
    } catch (error) {
        res.status(500).json({ error: 'Database error' });
    }
});

app.get('/api/horses/:id', async (req, res) => {
    try {
        const results = await query('SELECT * FROM horses WHERE id = $1', [req.params.id]);
        if (results.length === 0) {
            res.status(404).json({ error: 'Horse not found' });
            return;
        }
        res.json(results[0]);
    } catch (error) {
        res.status(500).json({ error: 'Database error' });
    }
});

// Забеги
app.get('/api/races', async (req, res) => {
    try {
        const { search, racecourse, direction, season, track, distance_type, rang } = req.query;

        let sql = `
            SELECT r.*, rc.name as racecourse_name 
            FROM races r 
            LEFT JOIN racecourses rc ON r.racecourse_id = rc.id 
            WHERE 1=1
        `;
        const params = [];
        let paramCount = 1;

        if (search) {
            sql += ` AND (r.name LIKE $${paramCount} OR rc.name LIKE $${paramCount + 1})`;
            params.push(`%${search}%`, `%${search}%`);
            paramCount += 2;
        }

        if (racecourse) {
            sql += ` AND rc.name = $${paramCount}`;
            params.push(racecourse);
            paramCount++;
        }

        if (direction) {
            sql += ` AND r.direction = $${paramCount}`;
            params.push(direction);
            paramCount++;
        }

        if (season) {
            sql += ` AND r.season = $${paramCount}`;
            params.push(season);
            paramCount++;
        }

        if (track) {
            sql += ` AND r.track_type = $${paramCount}`;
            params.push(track);
            paramCount++;
        }

        if (rang) {
            sql += ` AND r.rang = $${paramCount}`;
            params.push(rang);
            paramCount++;
        }

        if (distance_type) {
            switch (distance_type) {
                case 'sprint':
                    sql += ' AND r.distance BETWEEN 1000 AND 1200';
                    break;
                case 'mile':
                    sql += ' AND r.distance BETWEEN 1400 AND 1600';
                    break;
                case 'medium':
                    sql += ' AND r.distance BETWEEN 1700 AND 2200';
                    break;
                case 'long':
                    sql += ' AND r.distance BETWEEN 2300 AND 3200';
                    break;
            }
        }

        const distanceFrom = req.query.distance_from;
        const distanceTo = req.query.distance_to;
        
        if (distanceFrom) {
            sql += ` AND r.distance >= $${paramCount}`;
            params.push(distanceFrom);
            paramCount++;
        }
        if (distanceTo) {
            sql += ` AND r.distance <= $${paramCount}`;
            params.push(distanceTo);
            paramCount++;
        }

        sql += ' ORDER BY r.name';

        const results = await query(sql, params);
        res.json(results);
    } catch (error) {
        res.status(500).json({ error: 'Database error' });
    }
});

// Ипподромы
app.get('/api/racecourses', async (req, res) => {
    try {
        const { search, track, direction, corners } = req.query;

        let sql = 'SELECT * FROM racecourses WHERE 1=1';
        const params = [];
        let paramCount = 1;

        if (search) {
            sql += ` AND name LIKE $${paramCount}`;
            params.push(`%${search}%`);
            paramCount++;
        }

        if (track) {
            sql += ` AND track_types LIKE $${paramCount}`;
            params.push(`%${track}%`);
            paramCount++;
        }

        if (direction) {
            sql += ` AND direction = $${paramCount}`;
            params.push(direction);
            paramCount++;
        }

        if (corners) {
            sql += ` AND corners = $${paramCount}`;
            params.push(corners);
            paramCount++;
        }

        const distanceFrom = req.query.distance_from;
        const distanceTo = req.query.distance_to;
        
        if (distanceFrom) {
            sql += ` AND main_distance >= $${paramCount}`;
            params.push(distanceFrom);
            paramCount++;
        }
        if (distanceTo) {
            sql += ` AND main_distance <= $${paramCount}`;
            params.push(distanceTo);
            paramCount++;
        }

        sql += ' ORDER BY name';

        const results = await query(sql, params);
        res.json(results);
    } catch (error) {
        res.status(500).json({ error: 'Database error' });
    }
});

// Доступные забеги
app.get('/api/available-races', async (req, res) => {
    try {
        const results = await query('SELECT id, name FROM races ORDER BY name');
        res.json(results);
    } catch (error) {
        res.status(500).json({ error: 'Database error' });
    }
});

// Доступные лошади
app.get('/api/available-horses', async (req, res) => {
    try {
        const results = await query('SELECT id, name FROM horses ORDER BY name');
        res.json(results);
    } catch (error) {
        res.status(500).json({ error: 'Database error' });
    }
});

// Жокеи
app.get('/api/jockeys', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, username, license_number, created_at FROM jockeys');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Статистика жокеев - ИСПРАВЛЕНО
aapp.get('/api/jockeys/stats', async (req, res) => {
  try {
    // 1. Статистика по жокеям
    const jockeysStats = await pool.query(`
      SELECT 
        COUNT(*) as "totalJockeys",
        COUNT(DISTINCT license_number) as "uniqueLicenses"
      FROM jockeys
    `);

    // 2. Статистика по заявкам
    const entriesStats = await pool.query(`
      SELECT COUNT(*) as "totalEntries"
      FROM race_entries
    `);

    // 3. Получаем всех жокеев с названиями их гонок
    const jockeys = await pool.query(`
      SELECT 
        j.id,
        j.name,
        j.license_number,
        j.created_at,
        COUNT(re.id) as total_entries,
        ARRAY_AGG(
          r.name ORDER BY re.created_at DESC
        ) FILTER (WHERE r.name IS NOT NULL) as race_names
      FROM jockeys j
      LEFT JOIN race_entries re ON j.license_number = re.license_number
      LEFT JOIN races r ON re.race_id = r.id
      GROUP BY j.id, j.name, j.license_number, j.created_at
      ORDER BY j.name
    `);

    res.json({
      stats: {
        totalJockeys: parseInt(jockeysStats.rows[0].totalJockeys) || 0,
        totalEntries: parseInt(entriesStats.rows[0].totalEntries) || 0
      },
      jockeys: jockeys.rows
    });

  } catch (error) {
    console.error('Error fetching jockeys stats:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Логин
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        const results = await query('SELECT * FROM jockeys WHERE username = $1 AND password = $2', [username, password]);
        
        if (results.length > 0) {
            const user = results[0];
            res.json({ 
                success: true, 
                user: {
                    id: user.id,
                    name: user.name,
                    username: user.username,
                    license_number: user.license_number
                }
            });
        } else {
            res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Database error' });
    }
});

// Регистрация
app.post('/api/auth/register', async (req, res) => {
    try {
        const { fullName, username, password, licenseNumber } = req.body;

        const existing = await query('SELECT id FROM jockeys WHERE username = $1', [username]);
        
        if (existing.length > 0) {
            res.status(400).json({ success: false, message: 'Username already exists' });
            return;
        }

        const sql = 'INSERT INTO jockeys (name, username, password, license_number) VALUES ($1, $2, $3, $4) RETURNING *';
        const result = await query(sql, [fullName, username, password, licenseNumber]);
        
        res.json({ 
            success: true, 
            user: {
                id: result[0].id,
                name: fullName,
                username: username
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Database error' });
    }
});

// Анкета на участие
app.post('/api/race-entries', async (req, res) => {
    try {
        const { jockeyName, licenseNumber, horseId, raceId, saddlecloth, barrier, declaredWeight } = req.body;
        
        if (declaredWeight < 50 || declaredWeight > 70) {
            return res.status(400).json({ success: false, message: 'Weight must be between 50-70kg' });
        }

        const sql = `INSERT INTO race_entries (jockey_name, license_number, horse_id, race_id, saddlecloth, barrier, declared_weight, status) 
                     VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending') RETURNING id`;
        
        const result = await query(sql, [jockeyName, licenseNumber, horseId, raceId, saddlecloth, barrier, declaredWeight]);
        
        res.json({ 
            success: true, 
            entryId: result[0].id
        });
    } catch (error) {
        res.status(500).json({ error: 'Database error' });
    }
});

// Профиль
app.get('/api/user/profile/:userId', async (req, res) => {
    try {
        const sql = 'SELECT id, name, username, license_number, created_at FROM jockeys WHERE id = $1';
        const results = await query(sql, [req.params.userId]);
        if (results.length === 0) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        res.json(results[0]);
    } catch (error) {
        res.status(500).json({ error: 'Database error' });
    }
});

// ===================== НОВЫЕ ENDPOINT'Ы ДЛЯ ЗАЯВОК =====================

// Получить все заявки (для директории жокеев)
app.get('/api/race-entries', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        re.*,
        j.name as jockey_name,
        j.license_number,
        r.name as race_name,
        h.name as horse_name
      FROM race_entries re
      LEFT JOIN jockeys j ON re.license_number = j.license_number
      LEFT JOIN races r ON re.race_id = r.id
      LEFT JOIN horses h ON re.horse_id = h.id
      ORDER BY re.created_at DESC
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching race entries:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Получить заявки пользователя по его ID
app.get('/api/user/entries/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // 1. Находим license_number пользователя
    const userResult = await pool.query(
      'SELECT license_number FROM jockeys WHERE id = $1',
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const licenseNumber = userResult.rows[0].license_number;
    
    // 2. Находим все заявки этого пользователя
    const entriesResult = await pool.query(`
      SELECT 
        re.*,
        r.name as race_name,
        h.name as horse_name
      FROM race_entries re
      LEFT JOIN races r ON re.race_id = r.id
      LEFT JOIN horses h ON re.horse_id = h.id
      WHERE re.license_number = $1
      ORDER BY re.created_at DESC
    `, [licenseNumber]);
    
    res.json({
      entries: entriesResult.rows
    });
    
  } catch (error) {
    console.error('Error fetching user entries:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Получить заявки по номеру лицензии
app.get('/api/race-entries/license/:licenseNumber', async (req, res) => {
  try {
    const licenseNumber = req.params.licenseNumber;
    
    const result = await pool.query(`
      SELECT 
        re.*,
        r.name as race_name,
        h.name as horse_name
      FROM race_entries re
      LEFT JOIN races r ON re.race_id = r.id
      LEFT JOIN horses h ON re.horse_id = h.id
      WHERE re.license_number = $1
      ORDER BY re.created_at DESC
    `, [licenseNumber]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching entries by license:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// ===================== ENDPOINTS ДЛЯ ИЗБРАННОГО (FAVORITES) ======================

// 1. Получить избранных лошадей для пользователя
app.get('/api/user/favorites/horses/:userId', async (req, res) => {
    try {
        const sql = `
            SELECT h.* 
            FROM user_favorite_horses ufh
            JOIN horses h ON ufh.horse_id = h.id
            WHERE ufh.user_id = $1
        `;
        const results = await query(sql, [req.params.userId]);
        res.json(results);
    } catch (error) {
        console.error('Error fetching favorite horses:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// 2. Получить избранные забеги для пользователя
app.get('/api/user/favorites/races/:userId', async (req, res) => {
    try {
        const sql = `
            SELECT r.* 
            FROM user_favorite_races ufr
            JOIN races r ON ufr.race_id = r.id
            WHERE ufr.user_id = $1
        `;
        const results = await query(sql, [req.params.userId]);
        res.json(results);
    } catch (error) {
        console.error('Error fetching favorite races:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// 3. Получить избранные ипподромы для пользователя
app.get('/api/user/favorites/racecourses/:userId', async (req, res) => {
    try {
        const sql = `
            SELECT rc.* 
            FROM user_favorite_racecourses ufrc
            JOIN racecourses rc ON ufrc.racecourse_id = rc.id
            WHERE ufrc.user_id = $1
        `;
        const results = await query(sql, [req.params.userId]);
        res.json(results);
    } catch (error) {
        console.error('Error fetching favorite racecourses:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// 4. Добавить/удалить лошадь в избранное
app.post('/api/user/favorites/horses', async (req, res) => {
    try {
        const { userId, horseId } = req.body;
        const sql = `
            INSERT INTO user_favorite_horses (user_id, horse_id) 
            VALUES ($1, $2) 
            ON CONFLICT (user_id, horse_id) DO NOTHING
            RETURNING id
        `;
        const result = await query(sql, [userId, horseId]);
        res.json({ success: true, favoriteId: result[0]?.id });
    } catch (error) {
        console.error('Error adding favorite horse:', error);
        res.status(500).json({ success: false, error: 'Database error' });
    }
});

app.delete('/api/user/favorites/horses', async (req, res) => {
    try {
        const { userId, horseId } = req.body;
        const sql = `DELETE FROM user_favorite_horses WHERE user_id = $1 AND horse_id = $2`;
        await query(sql, [userId, horseId]);
        res.json({ success: true });
    } catch (error) {
        console.error('Error removing favorite horse:', error);
        res.status(500).json({ success: false, error: 'Database error' });
    }
});

// 5. Добавить/удалить забег в избранное
app.post('/api/user/favorites/races', async (req, res) => {
    try {
        const { userId, raceId } = req.body;
        const sql = `
            INSERT INTO user_favorite_races (user_id, race_id) 
            VALUES ($1, $2) 
            ON CONFLICT (user_id, race_id) DO NOTHING
            RETURNING id
        `;
        const result = await query(sql, [userId, raceId]);
        res.json({ success: true, favoriteId: result[0]?.id });
    } catch (error) {
        console.error('Error adding favorite race:', error);
        res.status(500).json({ success: false, error: 'Database error' });
    }
});

app.delete('/api/user/favorites/races', async (req, res) => {
    try {
        const { userId, raceId } = req.body;
        const sql = `DELETE FROM user_favorite_races WHERE user_id = $1 AND race_id = $2`;
        await query(sql, [userId, raceId]);
        res.json({ success: true });
    } catch (error) {
        console.error('Error removing favorite race:', error);
        res.status(500).json({ success: false, error: 'Database error' });
    }
});

// 6. Добавить/удалить ипподром в избранное
app.post('/api/user/favorites/racecourses', async (req, res) => {
    try {
        const { userId, racecourseId } = req.body;
        const sql = `
            INSERT INTO user_favorite_racecourses (user_id, racecourse_id) 
            VALUES ($1, $2) 
            ON CONFLICT (user_id, racecourse_id) DO NOTHING
            RETURNING id
        `;
        const result = await query(sql, [userId, racecourseId]);
        res.json({ success: true, favoriteId: result[0]?.id });
    } catch (error) {
        console.error('Error adding favorite racecourse:', error);
        res.status(500).json({ success: false, error: 'Database error' });
    }
});

app.delete('/api/user/favorites/racecourses', async (req, res) => {
    try {
        const { userId, racecourseId } = req.body;
        const sql = `DELETE FROM user_favorite_racecourses WHERE user_id = $1 AND racecourse_id = $2`;
        await query(sql, [userId, racecourseId]);
        res.json({ success: true });
    } catch (error) {
        console.error('Error removing favorite racecourse:', error);
        res.status(500).json({ success: false, error: 'Database error' });
    }
});

// ===================== ФИНАЛЬНЫЕ ОБРАБОТЧИКИ ======================

app.use(/\/api\/.*/, (req, res) => {
    res.status(404).json({ error: 'API endpoint not found' });
});

app.get(/.*/, (req, res) => {
    res.sendFile(path.join(rootDir, '../pages', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`JRA Website running on port ${PORT}`);
});