const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Get the root directory
const rootDir = path.join(__dirname, '..');

// Serve static files from specific folders
app.use('/pages', express.static(path.join(rootDir, 'pages')));
app.use('/css', express.static(path.join(rootDir, 'css')));
app.use('/js', express.static(path.join(rootDir, 'js')));
app.use('/images', express.static(path.join(rootDir, 'images')));

// MySQL connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'g2hyz5k',
    database: 'jra_website'
});

// Connect to MySQL
db.connect((err) => {
    if (err) {
        console.error('Database connection failed: ' + err.stack);
        return;
    }
    console.log('Connected to MySQL database');
});

// ========== HTML ROUTES ==========

// Redirect root to /pages/
app.get('/', (req, res) => {
    res.redirect('/pages/');
});

// HTML Routes
app.get('/races', (req, res) => {
    res.sendFile(path.join(rootDir, 'pages', 'races.html'));
});

app.get('/horses', (req, res) => {
    res.sendFile(path.join(rootDir, 'pages', 'horses.html'));
});

app.get('/training', (req, res) => {
    res.sendFile(path.join(rootDir, 'pages', 'training_centers.html'));
});

app.get('/racecourses', (req, res) => {
    res.sendFile(path.join(rootDir, 'pages', 'racecourses.html'));
});

app.get('/jockeys', (req, res) => {
    res.sendFile(path.join(rootDir, 'pages', 'jockeys.html'));
});

app.get('/glossary', (req, res) => {
    res.sendFile(path.join(rootDir, 'pages', 'glossary.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(rootDir, 'pages', 'login.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(rootDir, 'pages', 'register.html'));
});

app.get('/race-entry', (req, res) => {
    res.sendFile(path.join(rootDir, 'pages', 'race-entry.html'));
});

app.get('/user', (req, res) => {
    res.sendFile(path.join(rootDir, 'pages', 'user.html'));
});

app.get('/jockeys-directory', (req, res) => {
    res.sendFile(path.join(rootDir, 'pages', 'jockeys-directory.html'));
});

// Training centers redirect
app.get('/training_centers', (req, res) => {
    res.redirect('/training');
});

// ========== API ROUTES ==========

// Utility function for database queries
const query = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.query(sql, params, (err, results) => {
            if (err) {
                console.error('Database error:', err.message);
                reject({ error: 'Database error', details: err.message });
                return;
            }
            resolve(results);
        });
    });
};

// Horses API
app.get('/api/horses', async (req, res) => {
    try {
        const { search, birth_year_from, birth_year_to, death_year_from, death_year_to,
                races_from, races_to, wins_from, wins_to, losses_from, losses_to,
                triple_crown, tiara_crown, other_achievements } = req.query;

        let sql = 'SELECT * FROM horses WHERE 1=1';
        const params = [];

        if (search) {
            sql += ' AND name LIKE ?';
            params.push(`%${search}%`);
        }

        if (birth_year_from) {
            sql += ' AND birth_year >= ?';
            params.push(birth_year_from);
        }
        if (birth_year_to) {
            sql += ' AND birth_year <= ?';
            params.push(birth_year_to);
        }

        if (death_year_from) {
            sql += ' AND death_year >= ?';
            params.push(death_year_from);
        }
        if (death_year_to) {
            sql += ' AND death_year <= ?';
            params.push(death_year_to);
        }

        if (races_from) {
            sql += ' AND total_races >= ?';
            params.push(races_from);
        }
        if (races_to) {
            sql += ' AND total_races <= ?';
            params.push(races_to);
        }

        if (wins_from) {
            sql += ' AND total_wins >= ?';
            params.push(wins_from);
        }
        if (wins_to) {
            sql += ' AND total_wins <= ?';
            params.push(wins_to);
        }

        if (losses_from) {
            sql += ' AND total_losses >= ?';
            params.push(losses_from);
        }
        if (losses_to) {
            sql += ' AND total_losses <= ?';
            params.push(losses_to);
        }

        if (triple_crown === 'true') sql += ' AND triple_crown = TRUE';
        if (tiara_crown === 'true') sql += ' AND tiara_crown = TRUE';
        if (other_achievements === 'true') sql += ' AND other_achievements = TRUE';

        sql += ' ORDER BY name';

        const results = await query(sql, params);
        res.json(results);
    } catch (error) {
        res.status(500).json({ error: 'Database error' });
    }
});

app.get('/api/horses/:id', async (req, res) => {
    try {
        const results = await query('SELECT * FROM horses WHERE id = ?', [req.params.id]);
        if (results.length === 0) {
            res.status(404).json({ error: 'Horse not found' });
            return;
        }
        res.json(results[0]);
    } catch (error) {
        res.status(500).json({ error: 'Database error' });
    }
});

// Races API
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

        if (search) {
            sql += ' AND (r.name LIKE ? OR rc.name LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }

        if (racecourse) {
            sql += ' AND rc.name = ?';
            params.push(racecourse);
        }

        if (direction) {
            sql += ' AND r.direction = ?';
            params.push(direction);
        }

        if (season) {
            sql += ' AND r.season = ?';
            params.push(season);
        }

        if (track) {
            sql += ' AND r.track_type = ?';
            params.push(track);
        }

        if (rang) {
            sql += ' AND r.rang = ?';
            params.push(rang);
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
            sql += ' AND r.distance >= ?';
            params.push(distanceFrom);
        }
        if (distanceTo) {
            sql += ' AND r.distance <= ?';
            params.push(distanceTo);
        }

        sql += ' ORDER BY r.name';

        const results = await query(sql, params);
        res.json(results);
    } catch (error) {
        res.status(500).json({ error: 'Database error' });
    }
});

// Racecourses API
app.get('/api/racecourses', async (req, res) => {
    try {
        const { search, track, direction, corners } = req.query;

        let sql = 'SELECT * FROM racecourses WHERE 1=1';
        const params = [];

        if (search) {
            sql += ' AND name LIKE ?';
            params.push(`%${search}%`);
        }

        if (track) {
            sql += ' AND track_types LIKE ?';
            params.push(`%${track}%`);
        }

        if (direction) {
            sql += ' AND direction = ?';
            params.push(direction);
        }

        if (corners) {
            sql += ' AND corners = ?';
            params.push(corners);
        }

        const distanceFrom = req.query.distance_from;
        const distanceTo = req.query.distance_to;
        
        if (distanceFrom) {
            sql += ' AND main_distance >= ?';
            params.push(distanceFrom);
        }
        if (distanceTo) {
            sql += ' AND main_distance <= ?';
            params.push(distanceTo);
        }

        sql += ' ORDER BY name';

        const results = await query(sql, params);
        res.json(results);
    } catch (error) {
        res.status(500).json({ error: 'Database error' });
    }
});

// Available races for race entry form
app.get('/api/available-races', async (req, res) => {
    try {
        const results = await query('SELECT id, name FROM races ORDER BY name');
        res.json(results);
    } catch (error) {
        res.status(500).json({ error: 'Database error' });
    }
});

// Available horses for race entry form
app.get('/api/available-horses', async (req, res) => {
    try {
        const results = await query('SELECT id, name FROM horses ORDER BY name');
        res.json(results);
    } catch (error) {
        res.status(500).json({ error: 'Database error' });
    }
});

// Authentication API
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        const results = await query('SELECT * FROM jockeys WHERE username = ? AND password = ?', [username, password]);
        
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

app.post('/api/auth/register', async (req, res) => {
    try {
        const { fullName, username, password, licenseNumber } = req.body;

        const existing = await query('SELECT id FROM jockeys WHERE username = ?', [username]);
        
        if (existing.length > 0) {
            res.status(400).json({ success: false, message: 'Username already exists' });
            return;
        }

        const sql = 'INSERT INTO jockeys (name, username, password, license_number) VALUES (?, ?, ?, ?)';
        const result = await query(sql, [fullName, username, password, licenseNumber]);
        
        res.json({ 
            success: true, 
            user: {
                id: result.insertId,
                name: fullName,
                username: username
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Database error' });
    }
});

// Race Entry API
app.post('/api/race-entries', async (req, res) => {
    try {
        const { jockeyName, licenseNumber, horseId, raceId, saddlecloth, barrier, declaredWeight } = req.body;
        
        // Validation
        if (declaredWeight < 50 || declaredWeight > 70) {
            return res.status(400).json({ success: false, message: 'Weight must be between 50-70kg' });
        }

        const sql = `INSERT INTO race_entries (jockey_name, license_number, horse_id, race_id, saddlecloth, barrier, declared_weight, status) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`;
        
        const result = await query(sql, [jockeyName, licenseNumber, horseId, raceId, saddlecloth, barrier, declaredWeight]);
        
        res.json({ 
            success: true, 
            entryId: result.insertId
        });
    } catch (error) {
        res.status(500).json({ error: 'Database error' });
    }
});

// User Favorites API
const favoritesHandlers = {
    horses: {
        table: 'user_favorite_horses',
        joinTable: 'horses',
        joinId: 'horse_id'
    },
    races: {
        table: 'user_favorite_races',
        joinTable: 'races',
        joinId: 'race_id'
    },
    racecourses: {
        table: 'user_favorite_racecourses',
        joinTable: 'racecourses',
        joinId: 'racecourse_id'
    }
};

Object.keys(favoritesHandlers).forEach(type => {
    const config = favoritesHandlers[type];
    
    app.post(`/api/user/favorites/${type}`, async (req, res) => {
        try {
            const { userId, [config.joinId]: itemId } = req.body;
            const sql = `INSERT IGNORE INTO ${config.table} (user_id, ${config.joinId}) VALUES (?, ?)`;
            await query(sql, [userId, itemId]);
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ error: 'Database error' });
        }
    });
    
    app.delete(`/api/user/favorites/${type}`, async (req, res) => {
        try {
            const { userId, [config.joinId]: itemId } = req.body;
            const sql = `DELETE FROM ${config.table} WHERE user_id = ? AND ${config.joinId} = ?`;
            await query(sql, [userId, itemId]);
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ error: 'Database error' });
        }
    });
    
    app.get(`/api/user/favorites/${type}/:userId`, async (req, res) => {
        try {
            const sql = `
                SELECT t.* FROM ${config.joinTable} t
                JOIN ${config.table} uf ON t.id = uf.${config.joinId}
                WHERE uf.user_id = ?
                ORDER BY uf.created_at DESC
            `;
            const results = await query(sql, [req.params.userId]);
            res.json(results);
        } catch (error) {
            res.status(500).json({ error: 'Database error' });
        }
    });
});

// User Profile API
app.get('/api/user/profile/:userId', async (req, res) => {
    try {
        const sql = 'SELECT id, name, username, license_number, created_at FROM jockeys WHERE id = ?';
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

app.get('/api/user/entries/:userId', async (req, res) => {
    try {
        const jockeyResults = await query('SELECT id, name, license_number FROM jockeys WHERE id = ?', [req.params.userId]);
        
        if (jockeyResults.length === 0) {
            res.status(404).json({ error: 'Jockey not found' });
            return;
        }
        
        const jockey = jockeyResults[0];
        
        const entriesQuery = `
            SELECT re.*, r.name as race_name, 
                   h.name as horse_name, rc.name as racecourse_name
            FROM race_entries re
            LEFT JOIN races r ON re.race_id = r.id
            LEFT JOIN horses h ON re.horse_id = h.id
            LEFT JOIN racecourses rc ON r.racecourse_id = rc.id
            WHERE re.license_number = ?
            ORDER BY re.submitted_at DESC
        `;
        
        const entries = await query(entriesQuery, [jockey.license_number]);
        
        res.json({
            success: true,
            jockey: jockey,
            entries: entries
        });
    } catch (error) {
        res.status(500).json({ error: 'Database error' });
    }
});

// Jockeys Directory API
app.get('/api/jockeys/stats', async (req, res) => {
    try {
        const jockeysSql = `
            SELECT 
                j.*, 
                COUNT(re.id) as total_entries
            FROM jockeys j
            LEFT JOIN race_entries re ON j.license_number = re.license_number
            GROUP BY j.id
            ORDER BY j.name ASC
        `;
        
        const jockeys = await query(jockeysSql);
        
        const promises = jockeys.map(jockey => {
            return new Promise(async (resolve) => {
                const entriesSql = `
                    SELECT re.*, r.name as race_name
                    FROM race_entries re
                    LEFT JOIN races r ON re.race_id = r.id
                    WHERE re.license_number = ?
                    ORDER BY re.submitted_at DESC
                    LIMIT 10
                `;
                
                try {
                    const entries = await query(entriesSql, [jockey.license_number]);
                    jockey.race_entries = entries;
                } catch (err) {
                    jockey.race_entries = [];
                }
                resolve(jockey);
            });
        });
        
        const completedJockeys = await Promise.all(promises);
        const totalEntries = completedJockeys.reduce((sum, j) => sum + (parseInt(j.total_entries) || 0), 0);
        
        res.json({
            jockeys: completedJockeys,
            stats: {
                totalJockeys: completedJockeys.length,
                totalEntries: totalEntries
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Database error' });
    }
});

// 404 handler for API routes
app.use(/\/api\/.*/, (req, res) => {
    res.status(404).json({ error: 'API endpoint not found' });
});

// ========== MATCHES YOUR OLD SERVER.JS EXACTLY ==========
// Catch-all route for client-side routing
app.get(/.*/, (req, res) => {
    res.sendFile(path.join(rootDir, 'pages', 'index.html'));
});

// Start server
app.listen(port, () => {
    console.log(`JRA Website running on http://localhost:${port}`);
    console.log('Available pages:');
    console.log('  - http://localhost:3000/ (redirects to /pages/)');
    console.log('  - http://localhost:3000/pages/ (main site)');
    console.log('  - http://localhost:3000/races');
    console.log('  - http://localhost:3000/horses');
    console.log('  - http://localhost:3000/training');
    console.log('  - http://localhost:3000/racecourses');
    console.log('  - http://localhost:3000/jockeys');
    console.log('  - http://localhost:3000/jockeys-directory');
    console.log('  - http://localhost:3000/login');
    console.log('  - http://localhost:3000/register');
    console.log('  - http://localhost:3000/race-entry');
    console.log('  - http://localhost:3000/user');
});