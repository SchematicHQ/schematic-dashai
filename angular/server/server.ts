import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { SchematicClient } from '@schematichq/schematic-typescript-node';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3001;
const COMPANY_ID = 'demo';
const DATA_DIR = path.join(__dirname, '..', 'data');

// Load secret key from environment
const SCHEMATIC_SECRET_KEY = process.env.SCHEMATIC_SECRET_KEY;
const SCHEMATIC_API_URL = process.env.SCHEMATIC_API_URL;

function getSchematicClient(): SchematicClient {
  if (!SCHEMATIC_SECRET_KEY) {
    throw new Error('SCHEMATIC_SECRET_KEY not set');
  }
  return new SchematicClient({
    apiKey: SCHEMATIC_SECRET_KEY,
    basePath: SCHEMATIC_API_URL || undefined,
  });
}

// JSON file helpers
function readJsonFile<T>(filename: string): T {
  const filePath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, '[]');
    return [] as unknown as T;
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function writeJsonFile(filename: string, data: unknown): void {
  const filePath = path.join(DATA_DIR, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

async function updateSchematicTrait(
  traitKey: string,
  count: number
): Promise<void> {
  if (!SCHEMATIC_SECRET_KEY) {
    console.warn('SCHEMATIC_SECRET_KEY not set, skipping trait update');
    return;
  }
  try {
    const client = getSchematicClient();
    await client.companies.upsertCompany({
      keys: { id: COMPANY_ID },
      traits: { [traitKey]: count },
    });
    await client.close();
  } catch (error) {
    console.error('Error updating Schematic trait:', error);
  }
}

// Access Token
app.get('/api/accessToken', async (_req, res) => {
  try {
    const client = getSchematicClient();
    const resp = await client.accesstokens.issueTemporaryAccessToken({
      lookup: { id: COMPANY_ID },
    });
    const accessToken = resp.data?.token;
    await client.close();
    res.json({ accessToken });
  } catch (error) {
    console.error('Error issuing access token:', error);
    res.status(500).json({ message: 'Failed to issue access token' });
  }
});

// Credit Balance
app.get('/api/credit-balance', async (_req, res) => {
  try {
    const client = getSchematicClient();
    const resp = await client.entitlements.getFeatureUsageByCompany({
      keys: { id: COMPANY_ID },
    });
    const { features } = resp.data;
    const feature = features.filter(
      (f: any) => f.priceBehavior === 'credit_burndown'
    )[0];
    await client.close();
    if (feature) {
      res.json({
        allocation: feature.creditTotal,
        usage: feature.creditUsed,
      });
    } else {
      res.json(null);
    }
  } catch (error) {
    console.error('Error fetching credit balance:', error);
    res.status(500).json({ message: 'Error fetching credit balance' });
  }
});

// Users CRUD
interface UserRecord {
  id: string;
  email: string;
  name: string;
  role: string;
  initials: string;
}

app.get('/api/users', (_req, res) => {
  try {
    const users = readJsonFile<UserRecord[]>('users.json');
    res.set('Cache-Control', 'no-store');
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const { name, email, role, initials } = req.body;
    if (!name || !email || !role) {
      res
        .status(400)
        .json({ message: 'Missing required fields: name, email, role' });
      return;
    }

    const users = readJsonFile<UserRecord[]>('users.json');
    if (users.some((u) => u.email === email)) {
      res
        .status(409)
        .json({ message: 'User with this email already exists' });
      return;
    }

    const userInitials =
      initials ||
      name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    const newId = String(
      Math.max(...users.map((u) => parseInt(u.id) || 0), 0) + 1
    );
    const newUser: UserRecord = {
      id: newId,
      name,
      email,
      role,
      initials: userInitials,
    };

    users.push(newUser);
    writeJsonFile('users.json', users);
    await updateSchematicTrait('user-seat', users.length);
    res.status(201).json(newUser);
  } catch (error) {
    console.error('Error adding user:', error);
    res.status(500).json({ message: 'Failed to add user' });
  }
});

app.delete('/api/users', async (req, res) => {
  try {
    const id = req.query.id as string;
    if (!id) {
      res.status(400).json({ message: 'Missing required parameter: id' });
      return;
    }

    const users = readJsonFile<UserRecord[]>('users.json');
    const filtered = users.filter((u) => u.id !== id);
    if (filtered.length === users.length) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    writeJsonFile('users.json', filtered);
    await updateSchematicTrait('user-seat', filtered.length);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Failed to delete user' });
  }
});

// Data Sources CRUD
interface DataSourceRecord {
  id: string;
  name: string;
  type: string;
  status: string;
  icon: string;
}

app.get('/api/data-sources', (_req, res) => {
  try {
    const sources = readJsonFile<DataSourceRecord[]>('data-sources.json');
    res.set('Cache-Control', 'no-store');
    res.json(sources);
  } catch (error) {
    console.error('Error fetching data sources:', error);
    res.status(500).json({ message: 'Failed to fetch data sources' });
  }
});

app.post('/api/data-sources', async (req, res) => {
  try {
    const { name, type, icon } = req.body;
    if (!name || !type) {
      res
        .status(400)
        .json({ message: 'Missing required fields: name, type' });
      return;
    }

    const sources = readJsonFile<DataSourceRecord[]>('data-sources.json');
    if (sources.some((s) => s.name === name)) {
      res
        .status(409)
        .json({ message: 'A data source with this name already exists' });
      return;
    }

    const newId = String(
      Math.max(...sources.map((s) => parseInt(s.id) || 0), 0) + 1
    );
    const newSource: DataSourceRecord = {
      id: newId,
      name,
      type,
      status: 'connected',
      icon: icon || '\uD83D\uDCCE',
    };

    sources.push(newSource);
    writeJsonFile('data-sources.json', sources);
    await updateSchematicTrait('data-source', sources.length);
    res.status(201).json(newSource);
  } catch (error) {
    console.error('Error adding data source:', error);
    res.status(500).json({ message: 'Failed to add data source' });
  }
});

app.delete('/api/data-sources', async (req, res) => {
  try {
    const id = req.query.id as string;
    if (!id) {
      res.status(400).json({ message: 'Missing required parameter: id' });
      return;
    }

    const sources = readJsonFile<DataSourceRecord[]>('data-sources.json');
    const filtered = sources.filter((s) => s.id !== id);
    if (filtered.length === sources.length) {
      res.status(404).json({ message: 'Data source not found' });
      return;
    }

    writeJsonFile('data-sources.json', filtered);
    await updateSchematicTrait('data-source', filtered.length);
    res.json({ message: 'Data source removed successfully' });
  } catch (error) {
    console.error('Error deleting data source:', error);
    res.status(500).json({ message: 'Failed to delete data source' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
