const { Pool } = require('pg');
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const rootDir = path.join(__dirname, '..');

// Папки
app.use('/pages', express.static(path.join(rootDir, 'pages')));
app.use('/css', express.static(path.join(rootDir, 'css')));
app.use('/js', express.static(path.join(rootDir, 'js')));
app.use('/images', express.static(path.join(rootDir, 'images')));

// PostgreSQL
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// Коннект к PostgreSQL
pool.connect((err, client, release) => {
    if (err) {
        console.error('Database connection failed: ' + err.stack);
        return;
    }
    console.log('Connected to PostgreSQL database');
    release();
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

        // Distance filtering
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

// АПИ для рейс энтри
app.get('/api/available-races', async (req, res) => {
    try {
        const results = await query('SELECT id, name FROM races ORDER BY name');
        res.json(results);
    } catch (error) {
        res.status(500).json({ error: 'Database error' });
    }
});

app.get('/api/available-horses', async (req, res) => {
    try {
        const results = await query('SELECT id, name FROM horses ORDER BY name');
        res.json(results);
    } catch (error) {
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

// Редирект на index.html
app.get(/.*/, (req, res) => {
    res.sendFile(path.join(rootDir, 'pages', 'index.html'));
});

app.listen(port, () => {
    console.log(`JRA Website running on http://localhost:${port}`);
});