
import dotenv from 'dotenv';
// Bezpečné načtení .env - pokud neexistuje (na Renderu), nevadí to.
try { dotenv.config(); } catch (e) {}

import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';

const app = express();
// FIX: Pokud je v .env nastaveno 3000, ignorujeme to a vynutíme 3001, abychom obešli chybu EADDRINUSE.
const envPort = process.env.PORT;
const PORT = (envPort && envPort != 3000) ? envPort : 3001;
const MONGODB_URI = process.env.MONGODB_URI;

// --- SECURITY CONFIG ---
const ADMIN_EMAIL = 'zbynekbal97@gmail.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'nexus-master-key';

console.log('\n🔵 --- STARTUJI NEXUS BACKEND (v2.1 Secured) ---');

// Security Check Log
if (process.env.ADMIN_PASSWORD) {
    console.log('🔒 ADMIN SECURITY: Vlastní heslo načteno.');
} else {
    console.warn('⚠️  ADMIN SECURITY: Používám VÝCHOZÍ heslo. Nastavte ADMIN_PASSWORD v .env!');
}

// --- DATABASE CONNECTION ---
if (!MONGODB_URI) {
    console.error('❌ CHYBA: Chybí MONGODB_URI v proměnných prostředí!');
} else {
    console.log('📡 Připojuji se k databázi...');
    mongoose.connect(MONGODB_URI)
        .then(() => console.log('✅ ÚSPĚCH: MongoDB připojeno.'))
        .catch(err => console.error('❌ CHYBA MONGODB:', err.message));
}

// --- MIDDLEWARE ---
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));

// --- SECURITY MIDDLEWARE ---
// Tento middleware chrání databázi admina před neoprávněnými změnami.
const protectAdminWriteOps = (req, res, next) => {
    // Zjistíme, na jaký email cílíme (z URL parametrů nebo Body)
    const targetEmail = (req.params.email || req.body.email || req.body.userEmail || '').toLowerCase().trim();
    
    // Pokud se snažíme zapisovat/mazat data ADMINA
    if (targetEmail === ADMIN_EMAIL) {
        // Kontrola pouze pro destruktivní metody
        if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
            const providedKey = req.headers['x-admin-key'];
            
            // Pokud klíč chybí nebo nesedí
            if (!providedKey || providedKey !== ADMIN_PASSWORD) {
                console.warn(`🛑 SECURITY ALERT: Pokus o neoprávněnou změnu Admin DB z IP: ${req.ip}`);
                return res.status(403).json({ 
                    message: '⛔ ACCESS DENIED: Chybí platný Admin Signing Key pro zápis do databáze.' 
                });
            }
        }
    }
    next();
};

// Aplikujeme ochranu globálně (middleware sám rozhodne, kdy zasáhnout)
app.use(protectAdminWriteOps);


// --- SCHEMAS ---
const ItemSchema = new mongoose.Schema({
    id: String,
    title: String,
    description: String,
    type: String, 
    rarity: String,
    flavorText: String,
    isShareable: Boolean,
    isConsumable: Boolean,
    canBeSaved: Boolean,
    price: Number,
    stats: [{ label: String, value: mongoose.Schema.Types.Mixed }],
    merchantItems: [{ id: String, stock: Number }],
    dilemmaOptions: [{
        label: String,
        consequenceText: String,
        physicalInstruction: String,
        effectType: String,
        effectValue: Number
    }],
    qrCodeUrl: String
}, { _id: false }); 

const UserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    nickname: String,
    inventory: [ItemSchema],
    friends: [String],
    requests: [{ fromEmail: String, timestamp: Number }]
}, { timestamps: true });

const RoomSchema = new mongoose.Schema({
    roomId: { type: String, required: true, unique: true, uppercase: true },
    host: String,
    members: [{ name: String, hp: Number, lastSeen: Number }],
    messages: [{ id: String, sender: String, text: String, timestamp: Number, isSystem: Boolean }]
}, { timestamps: true });
RoomSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 86400 });

const User = mongoose.model('User', UserSchema);
const Room = mongoose.model('Room', RoomSchema);

// --- HELPERS ---
const getOrCreateUser = async (rawEmail) => {
    if (!rawEmail) return null;
    const email = rawEmail.toLowerCase().trim();
    let user = await User.findOne({ email });
    if (!user) {
        user = await User.create({ email, nickname: email.split('@')[0], inventory: [], friends: [], requests: [] });
    }
    return user;
};

// --- ROUTES ---
app.get('/api/health', (req, res) => res.json({ status: 'online', timestamp: Date.now() }));

// Auth
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email) return res.status(400).json({ message: 'Email required' });
        
        const normalizedEmail = email.toLowerCase().trim();

        // SECURITY CHECK FOR ADMIN
        if (normalizedEmail === ADMIN_EMAIL) {
            if (!password || password !== ADMIN_PASSWORD) {
                console.warn(`⚠️ Neúspěšný pokus o přihlášení do ADMIN účtu: ${normalizedEmail}`);
                return res.status(401).json({ message: 'Neplatný Admin Access Key.' });
            }
            console.log(`🛡️ ADMIN PŘIHLÁŠEN: ${normalizedEmail}`);
        }

        const user = await getOrCreateUser(normalizedEmail);
        res.json({ email: user.email, isNewUser: user.inventory.length === 0 });
    } catch (e) { res.status(500).json({ message: e.message }); }
});

app.get('/api/users/:email/nickname', async (req, res) => {
    try {
        const user = await User.findOne({ email: req.params.email.toLowerCase() });
        res.json({ nickname: user ? user.nickname : '' });
    } catch (e) { res.status(500).json({ message: e.message }); }
});

app.post('/api/users/:email/nickname', async (req, res) => {
    try {
        const { nickname } = req.body;
        await User.findOneAndUpdate({ email: req.params.email.toLowerCase() }, { nickname }, { upsert: true, new: true });
        res.json({ success: true, nickname });
    } catch (e) { res.status(500).json({ message: e.message }); }
});

// Inventory
app.get('/api/inventory/:email', async (req, res) => {
    try {
        const user = await getOrCreateUser(req.params.email);
        res.json(user.inventory);
    } catch (e) { res.status(500).json({ message: e.message }); }
});

app.get('/api/inventory/:email/:cardId', async (req, res) => {
    try {
        const user = await User.findOne({ email: req.params.email.toLowerCase() });
        if (!user) return res.status(404).json({ message: 'User not found' });
        const item = user.inventory.find(i => i.id === req.params.cardId);
        if (item) res.json(item); else res.status(404).json({ message: 'Item not found' });
    } catch (e) { res.status(500).json({ message: e.message }); }
});

app.post('/api/inventory/:email', async (req, res) => {
    try {
        const user = await getOrCreateUser(req.params.email);
        const newItem = req.body;
        const existingIndex = user.inventory.findIndex(i => i.id === newItem.id);
        if (existingIndex >= 0) user.inventory[existingIndex] = newItem;
        else user.inventory.push(newItem);
        await user.save();
        res.json(newItem);
    } catch (e) { res.status(500).json({ message: e.message }); }
});

app.post('/api/inventory/:email/restore', async (req, res) => {
    try {
        const { items } = req.body;
        const user = await getOrCreateUser(req.params.email);
        user.inventory = items;
        await user.save();
        res.json({ success: true, count: items.length });
    } catch (e) { res.status(500).json({ message: e.message }); }
});

app.put('/api/inventory/:email/:cardId', async (req, res) => {
    try {
        const user = await User.findOne({ email: req.params.email.toLowerCase() });
        if (!user) return res.status(404).json({ message: 'User not found' });
        const index = user.inventory.findIndex(i => i.id === req.params.cardId);
        if (index !== -1) {
            user.inventory[index] = { ...user.inventory[index].toObject(), ...req.body };
            await user.save();
            res.json(user.inventory[index]);
        } else res.status(404).json({ message: 'Item not found' });
    } catch (e) { res.status(500).json({ message: e.message }); }
});

app.delete('/api/inventory/:email/:cardId', async (req, res) => {
    try {
        const user = await User.findOne({ email: req.params.email.toLowerCase() });
        if (!user) return res.status(404).json({ message: 'User not found' });
        user.inventory = user.inventory.filter(i => i.id !== req.params.cardId);
        await user.save();
        res.json({ success: true });
    } catch (e) { res.status(500).json({ message: e.message }); }
});

// Friends & Gifts
app.get('/api/users/:email/friends', async (req, res) => {
    try { const user = await getOrCreateUser(req.params.email); res.json({ friends: user.friends }); } catch (e) { res.status(500).json({ message: e.message }); }
});
app.get('/api/users/:email/friends/requests', async (req, res) => {
    try { const user = await getOrCreateUser(req.params.email); res.json(user.requests); } catch (e) { res.status(500).json({ message: e.message }); }
});
app.post('/api/users/:email/friends/request', async (req, res) => {
    try {
        const senderEmail = req.params.email.toLowerCase().trim();
        const targetEmail = req.body.targetEmail?.toLowerCase().trim();
        if (!targetEmail || senderEmail === targetEmail) return res.status(400).json({ message: 'Invalid request' });
        const targetUser = await getOrCreateUser(targetEmail);
        if (targetUser.friends.includes(senderEmail)) return res.json({ message: 'Already friends' });
        if (targetUser.requests.some(r => r.fromEmail === senderEmail)) return res.json({ message: 'Request already sent' });
        targetUser.requests.push({ fromEmail: senderEmail, timestamp: Date.now() });
        await targetUser.save();
        res.json({ success: true });
    } catch (e) { res.status(500).json({ message: e.message }); }
});
app.post('/api/users/:email/friends/respond', async (req, res) => {
    try {
        const userEmail = req.params.email.toLowerCase().trim();
        const targetEmail = req.body.targetEmail?.toLowerCase().trim();
        const { accept } = req.body;
        const user = await User.findOne({ email: userEmail });
        user.requests = user.requests.filter(r => r.fromEmail !== targetEmail);
        if (accept) {
            if (!user.friends.includes(targetEmail)) user.friends.push(targetEmail);
            const targetUser = await User.findOne({ email: targetEmail });
            if (targetUser && !targetUser.friends.includes(userEmail)) {
                targetUser.friends.push(userEmail);
                await targetUser.save();
            }
        }
        await user.save();
        res.json({ success: true });
    } catch (e) { res.status(500).json({ message: e.message }); }
});
app.post('/api/inventory/send-gift', async (req, res) => {
    try {
        const { fromEmail, cardId } = req.body;
        const user = await User.findOne({ email: fromEmail.toLowerCase().trim() });
        if (!user) return res.status(404).json({ message: 'Sender not found' });
        const itemIndex = user.inventory.findIndex(i => i.id === cardId);
        if (itemIndex === -1) return res.status(404).json({ message: 'Item not found' });
        const item = user.inventory[itemIndex];
        user.inventory.splice(itemIndex, 1);
        await user.save();
        res.json({ success: true, item });
    } catch (e) { res.status(500).json({ message: e.message }); }
});

// Rooms
app.post('/api/rooms', async (req, res) => {
    try {
        const { roomId, hostName } = req.body;
        let room = await Room.findOne({ roomId });
        if (!room) {
            room = await Room.create({
                roomId, host: hostName,
                members: [{ name: hostName, hp: 100, lastSeen: Date.now() }],
                messages: []
            });
        }
        res.json({ success: true, roomId });
    } catch (e) { res.status(500).json({ message: e.message }); }
});
app.post('/api/rooms/:roomId/join', async (req, res) => {
    try {
        const { roomId } = req.params;
        const { userName, hp } = req.body;
        const room = await Room.findOne({ roomId });
        if (!room) return res.status(404).json({ message: 'Room not found' });
        if (!room.members.find(m => m.name === userName)) {
            room.members.push({ name: userName, hp: hp || 100, lastSeen: Date.now() });
            room.messages.push({ id: 'sys-' + Date.now(), sender: 'SYSTEM', text: `${userName} se připojil/a.`, timestamp: Date.now(), isSystem: true });
            await room.save();
        }
        res.json({ success: true });
    } catch (e) { res.status(500).json({ message: e.message }); }
});
app.post('/api/rooms/:roomId/status', async (req, res) => {
    try {
        const { roomId } = req.params;
        const { userName, hp } = req.body;
        await Room.updateOne({ roomId, "members.name": userName }, { $set: { "members.$.hp": hp, "members.$.lastSeen": Date.now() } });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ message: e.message }); }
});
app.get('/api/rooms/:roomId/members', async (req, res) => {
    try { const room = await Room.findOne({ roomId: req.params.roomId }); res.json(room ? room.members : []); } catch (e) { res.status(500).json({ message: e.message }); }
});
app.post('/api/rooms/:roomId/leave', async (req, res) => {
    try {
        const { roomId } = req.params;
        const { userName } = req.body;
        const room = await Room.findOne({ roomId });
        if (room) {
            room.members = room.members.filter(u => u.name !== userName);
            room.messages.push({ id: 'sys-' + Date.now(), sender: 'SYSTEM', text: `${userName} odešel/a.`, timestamp: Date.now(), isSystem: true });
            if (room.members.length === 0) await Room.deleteOne({ roomId }); else await room.save();
        }
        res.json({ success: true });
    } catch (e) { res.status(500).json({ message: e.message }); }
});
app.get('/api/rooms/:roomId/messages', async (req, res) => {
    try { const room = await Room.findOne({ roomId: req.params.roomId }); res.json(room ? room.messages : []); } catch (e) { res.status(500).json({ message: e.message }); }
});
app.post('/api/rooms/:roomId/messages', async (req, res) => {
    try {
        const { roomId } = req.params;
        const { sender, text } = req.body;
        const room = await Room.findOne({ roomId });
        if (!room) return res.status(404).json({ message: 'Room not found' });
        const msg = { id: Date.now().toString(), sender, text, timestamp: Date.now() };
        room.messages.push(msg);
        if (room.messages.length > 100) room.messages = room.messages.slice(-100);
        await room.save();
        res.json(msg);
    } catch (e) { res.status(500).json({ message: e.message }); }
});

app.post('/api/gemini/interpret-code', (req, res) => res.json({ id: req.body.code, title: "Mystery Item", description: "Backend Mock", type: "PŘEDMĚT", rarity: "Common" }));

app.listen(PORT, () => {
    console.log(`✅ Nexus Backend running on port ${PORT}`);
});
