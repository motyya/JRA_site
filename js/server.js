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

// FIX: Redirect root to /pages/
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

// Training centers redirect
app.get('/training_centers', (req, res) => {
    res.redirect('/training');
});

// API Routes

// Horses API
app.get('/api/horses', (req, res) => {
    const {
        search,
        birth_year_from,
        birth_year_to,
        death_year_from,
        death_year_to,
        races_from,
        races_to,
        wins_from,
        wins_to,
        losses_from,
        losses_to,
        triple_crown,
        tiara_crown,
        other_achievements
    } = req.query;

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

    db.query(sql, params, (err, results) => {
        if (err) {
            console.error('Database error:', err);
            res.status(500).json({ error: 'Database error' });
            return;
        }
        res.json(results);
    });
});

app.get('/api/horses/:id', (req, res) => {
    const horseId = req.params.id;
    
    db.query('SELECT * FROM horses WHERE id = ?', [horseId], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            res.status(500).json({ error: 'Database error' });
            return;
        }
        if (results.length === 0) {
            res.status(404).json({ error: 'Horse not found' });
            return;
        }
        res.json(results[0]);
    });
});

// Races API
app.get('/api/races', (req, res) => {
    const {
        search,
        racecourse,
        direction,
        season,
        track,
        distance_type,
        rang,
        status
    } = req.query;

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

    if (status) {
        if (status === 'upcoming') {
            sql += ' AND r.status = "upcoming"';
        } else if (status === 'finished') {
            sql += ' AND r.status = "finished"';
        }
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

    db.query(sql, params, (err, results) => {
        if (err) {
            console.error('Database error:', err);
            res.status(500).json({ error: 'Database error' });
            return;
        }
        res.json(results);
    });
});

// Racecourses API
app.get('/api/racecourses', (req, res) => {
    const {
        search,
        track,
        direction,
        corners
    } = req.query;

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

    db.query(sql, params, (err, results) => {
        if (err) {
            console.error('Database error:', err);
            res.status(500).json({ error: 'Database error' });
            return;
        }
        res.json(results);
    });
});

// Available races for race entry form
app.get('/api/available-races', (req, res) => {
    db.query('SELECT id, name FROM races WHERE status = "upcoming" ORDER BY name', (err, results) => {
        if (err) {
            console.error('Database error:', err);
            res.status(500).json({ error: 'Database error' });
            return;
        }
        res.json(results);
    });
});

// Authentication API
app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    
    console.log('Login attempt for user:', username);

    db.query('SELECT * FROM jockeys WHERE username = ? AND password = ?', [username, password], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            res.status(500).json({ error: 'Database error' });
            return;
        }
        
        if (results.length > 0) {
            const user = results[0];
            console.log('Login successful for user:', user.name);
            res.json({ 
                success: true, 
                message: 'Login successful',
                user: {
                    id: user.id,
                    name: user.name,
                    username: user.username,
                    license_number: user.license_number
                }
            });
        } else {
            console.log('Login failed for user:', username);
            res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
    });
});

app.post('/api/auth/register', (req, res) => {
    const { fullName, username, password, licenseNumber } = req.body;

    console.log('Registration attempt:', { fullName, username, licenseNumber });

    db.query('SELECT id FROM jockeys WHERE username = ?', [username], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            res.status(500).json({ error: 'Database error' });
            return;
        }
        
        if (results.length > 0) {
            res.status(400).json({ success: false, message: 'Username already exists' });
            return;
        }

        const sql = 'INSERT INTO jockeys (name, username, password, license_number) VALUES (?, ?, ?, ?)';
        db.query(sql, [fullName, username, password, licenseNumber], (err, results) => {
            if (err) {
                console.error('Database insert error:', err);
                res.status(500).json({ error: 'Database error' });
                return;
            }
            
            console.log('Registration successful for user:', username);
            res.json({ 
                success: true, 
                message: 'Registration successful',
                user: {
                    id: results.insertId,
                    name: fullName,
                    username: username
                }
            });
        });
    });
});

// Race Entry API
app.get('/api/available-horses', (req, res) => {
    db.query('SELECT id, name FROM horses ORDER BY name', (err, results) => {
        if (err) {
            console.error('Database error:', err);
            res.status(500).json({ error: 'Database error' });
            return;
        }
        res.json(results);
    });
});

app.post('/api/race-entries', (req, res) => {
    const { jockeyName, licenseNumber, horseId, raceId, saddlecloth, barrier, declaredWeight } = req.body;
    
    console.log('Race entry submission:', { jockeyName, horseId, saddlecloth });

    const sql = `INSERT INTO race_entries (jockey_name, license_number, horse_id, race_id, saddlecloth, barrier, declared_weight, status) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`;
    
    db.query(sql, [jockeyName, licenseNumber, horseId, raceId, saddlecloth, barrier, declaredWeight], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            res.status(500).json({ error: 'Database error' });
            return;
        }
        res.json({ success: true, entryId: results.insertId, message: 'Race entry submitted successfully' });
    });
});

// User Favorites API
app.post('/api/user/favorites/horses', (req, res) => {
    const { userId, horseId } = req.body;
    
    const sql = 'INSERT IGNORE INTO user_favorite_horses (user_id, horse_id) VALUES (?, ?)';
    db.query(sql, [userId, horseId], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            res.status(500).json({ error: 'Database error' });
            return;
        }
        res.json({ success: true, message: 'Horse added to favorites' });
    });
});

app.delete('/api/user/favorites/horses', (req, res) => {
    const { userId, horseId } = req.body;
    
    const sql = 'DELETE FROM user_favorite_horses WHERE user_id = ? AND horse_id = ?';
    db.query(sql, [userId, horseId], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            res.status(500).json({ error: 'Database error' });
            return;
        }
        res.json({ success: true, message: 'Horse removed from favorites' });
    });
});

app.get('/api/user/favorites/horses/:userId', (req, res) => {
    const userId = req.params.userId;
    
    const sql = `
        SELECT h.* FROM horses h
        JOIN user_favorite_horses ufh ON h.id = ufh.horse_id
        WHERE ufh.user_id = ?
        ORDER BY ufh.created_at DESC
    `;
    
    db.query(sql, [userId], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            res.status(500).json({ error: 'Database error' });
            return;
        }
        res.json(results);
    });
});

app.post('/api/user/favorites/races', (req, res) => {
    const { userId, raceId } = req.body;
    
    const sql = 'INSERT IGNORE INTO user_favorite_races (user_id, race_id) VALUES (?, ?)';
    db.query(sql, [userId, raceId], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            res.status(500).json({ error: 'Database error' });
            return;
        }
        res.json({ success: true, message: 'Race added to favorites' });
    });
});

app.delete('/api/user/favorites/races', (req, res) => {
    const { userId, raceId } = req.body;
    
    const sql = 'DELETE FROM user_favorite_races WHERE user_id = ? AND race_id = ?';
    db.query(sql, [userId, raceId], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            res.status(500).json({ error: 'Database error' });
            return;
        }
        res.json({ success: true, message: 'Race removed from favorites' });
    });
});

app.get('/api/user/favorites/races/:userId', (req, res) => {
    const userId = req.params.userId;
    
    const sql = `
        SELECT r.* FROM races r
        JOIN user_favorite_races ufr ON r.id = ufr.race_id
        WHERE ufr.user_id = ?
        ORDER BY ufr.created_at DESC
    `;
    
    db.query(sql, [userId], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            res.status(500).json({ error: 'Database error' });
            return;
        }
        res.json(results);
    });
});

app.post('/api/user/favorites/racecourses', (req, res) => {
    const { userId, racecourseId } = req.body;
    
    const sql = 'INSERT IGNORE INTO user_favorite_racecourses (user_id, racecourse_id) VALUES (?, ?)';
    db.query(sql, [userId, racecourseId], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            res.status(500).json({ error: 'Database error' });
            return;
        }
        res.json({ success: true, message: 'Racecourse added to favorites' });
    });
});

app.delete('/api/user/favorites/racecourses', (req, res) => {
    const { userId, racecourseId } = req.body;
    
    const sql = 'DELETE FROM user_favorite_racecourses WHERE user_id = ? AND racecourse_id = ?';
    db.query(sql, [userId, racecourseId], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            res.status(500).json({ error: 'Database error' });
            return;
        }
        res.json({ success: true, message: 'Racecourse removed from favorites' });
    });
});

app.get('/api/user/favorites/racecourses/:userId', (req, res) => {
    const userId = req.params.userId;
    
    const sql = `
        SELECT rc.* FROM racecourses rc
        JOIN user_favorite_racecourses ufrc ON rc.id = ufrc.racecourse_id
        WHERE ufrc.user_id = ?
        ORDER BY ufrc.created_at DESC
    `;
    
    db.query(sql, [userId], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            res.status(500).json({ error: 'Database error' });
            return;
        }
        res.json(results);
    });
});

// User Profile API
app.get('/api/user/profile/:userId', (req, res) => {
    const userId = req.params.userId;
    
    const sql = 'SELECT id, name, username, license_number, created_at FROM jockeys WHERE id = ?';
    db.query(sql, [userId], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            res.status(500).json({ error: 'Database error' });
            return;
        }
        if (results.length === 0) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        res.json(results[0]);
    });
});

// 404 handler for API routes
app.use(/\/api\/.*/, (req, res) => {
    res.status(404).json({ error: 'API endpoint not found' });
});

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
    console.log('  - http://localhost:3000/login');
    console.log('  - http://localhost:3000/register');
    console.log('  - http://localhost:3000/race-entry');
    console.log('  - http://localhost:3000/user');
});