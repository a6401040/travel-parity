import { createServer } from 'http'
import app from './app.js'
import { env } from './config/env.js'

const server = createServer(app)
const port = Number(env.PORT || 3001)
server.listen(port)
