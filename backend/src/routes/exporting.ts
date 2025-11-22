import { Router } from 'express'
import { z } from 'zod'
import { requireSession } from '../middlewares/session.js'
import { getDownloadSettings } from '../db/userSettings.js'
import { LLMOutputSchema } from '../schemas/llm.js'
import { PDFDocument, StandardFonts } from 'pdf-lib'
import * as fontkit from 'fontkit'
import fs from 'fs'
import path from 'path'
import { env } from '../config/env.js'

export const router = Router()

function safe(s: string) {
  return s.replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 120)
}

function buildName(meta: any, ext: string) {
  const ts = Date.now()
  const origin = safe(String(meta?.origin || 'origin'))
  const destination = safe(String(meta?.destination || 'dest'))
  const date = safe(String(meta?.date || 'date'))
  return `${origin}-${destination}-${date}-${ts}.${ext}`
}

function buildTOC(data: any) {
  const toc: string[] = []
  toc.push('## 目录')
  toc.push('- [出行方案](#出行方案)')
  if (data?.schemes?.timeFirst) toc.push('  - [时间优先](#时间优先)')
  if (data?.schemes?.priceFirst) toc.push('  - [价格优先](#价格优先)')
  if (data?.schemes?.balanced) toc.push('  - [综合优先](#综合优先)')
  if (data?.hotels) toc.push('- [酒店推荐](#酒店推荐)')
  if (data?.routes) toc.push('- [热门路线](#热门路线)')
  toc.push('- [评分明细附录](#评分明细附录)')
  return toc.join('\n')
}

function buildScoringAppendix(data: any) {
  const lines: string[] = []
  lines.push('## 评分明细附录')
  const dump = (title: string, list: any[]) => {
    lines.push(`### ${title}`)
    for (const s of list || []) {
      lines.push(`- 总时长: ${s.totalTimeMinutes} 分钟 | 总价格: ￥${s.totalPrice} | 换乘: ${s.transfers} | 舒适度: ${s.comfortScore} | 风险分: ${s.riskScore} | 综合分: ${s.score ?? '-'}`)
      if (s.reason) lines.push(`  理由: ${s.reason}`)
    }
  }
  if (data?.schemes?.timeFirst) dump('时间优先', data.schemes.timeFirst)
  if (data?.schemes?.priceFirst) dump('价格优先', data.schemes.priceFirst)
  if (data?.schemes?.balanced) dump('综合优先', data.schemes.balanced)
  return lines.join('\n')
}

function toMarkdown(data: any) {
  const lines: string[] = []
  lines.push('# 出行方案')
  lines.push(buildTOC(data))
  const renderSchemes = (title: string, list: any[]) => {
    lines.push(`## ${title}`)
    for (const s of list || []) {
      lines.push(`- 总时长: ${s.totalTimeMinutes} 分钟 | 总价格: ￥${s.totalPrice} | 换乘: ${s.transfers} | 舒适度: ${s.comfortScore}`)
      if (data?.settings?.include_segments_detail || data?.include_segments_detail) {
        lines.push('  段详情:')
        for (const seg of s.segments || []) {
          lines.push(`  - ${seg.mode} ${seg.optionId} | ${seg.departTime} → ${seg.arriveTime} | ￥${seg.price}`)
        }
      }
      if (s.reason) lines.push(`  理由: ${s.reason}`)
    }
  }
  if (data?.schemes?.timeFirst) renderSchemes('时间优先', data.schemes.timeFirst)
  if (data?.schemes?.priceFirst) renderSchemes('价格优先', data.schemes.priceFirst)
  if (data?.schemes?.balanced) renderSchemes('综合优先', data.schemes.balanced)
  if (data?.hotels) lines.push('## 酒店推荐', ...data.hotels.map((h: any) => `- ${h.name} | 评分 ${h.rating ?? '-'} | ￥${h.price ?? '-'}`))
  if (data?.routes) lines.push('## 热门路线', ...data.routes.map((r: any) => `- ${r.name} | 天数 ${r.days} | 里程 ${r.totalDistanceKm ?? '-'}km`))
  lines.push(buildScoringAppendix(data))
  return lines.join('\n')
}

router.post('/export/llm/json', requireSession, async (req, res) => {
  try {
    const parsed = LLMOutputSchema.parse(req.body)
    const name = buildName(req.body?.meta, 'json')
    res.setHeader('Content-Disposition', `attachment; filename="${name}"`)
    res.json(parsed)
  } catch (e: any) {
    res.status(400).json({ error: 'invalid_llm_output', message: e?.message || 'error' })
  }
})

router.post('/export/llm/markdown', requireSession, async (req: any, res) => {
  try {
    const parsed = LLMOutputSchema.parse(req.body)
    const pref = await getDownloadSettings(Number(req.user.id))
    const md = toMarkdown(parsed)
    const name = buildName(req.body?.meta, 'md')
    res.setHeader('Content-Type', 'text/markdown; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="${name}"`)
    res.send(md)
  } catch (e: any) {
    res.status(400).json({ error: 'invalid_llm_output', message: e?.message || 'error' })
  }
})

router.post('/export/llm/pdf', requireSession, async (req: any, res) => {
  try {
    const parsed = LLMOutputSchema.parse(req.body)
    const pref = await getDownloadSettings(Number(req.user.id))
    const pdf = await PDFDocument.create()
    pdf.registerFontkit(fontkit as any)
    let font
    let fontWarn = ''
    try {
      if (env.PDF_FONT_PATH && fs.existsSync(path.resolve(process.cwd(), env.PDF_FONT_PATH))) {
        const buf = fs.readFileSync(path.resolve(process.cwd(), env.PDF_FONT_PATH))
        font = await pdf.embedFont(buf)
      } else {
        font = await pdf.embedFont(StandardFonts.Helvetica)
        fontWarn = '字体未配置，使用默认字体'
      }
    } catch {
      font = await pdf.embedFont(StandardFonts.Helvetica)
      fontWarn = '字体加载失败，使用默认字体'
    }
    const page = pdf.addPage([595, 842])
    const fontSize = 10
    const header = `出行助手 | ${String(req.body?.meta?.origin || '')}→${String(req.body?.meta?.destination || '')} ${String(req.body?.meta?.date || '')}`
    page.drawText(header, { x: 40, y: 820, size: 12, font })
    if (fontWarn) page.drawText(fontWarn, { x: 400, y: 820, size: 8, font })
    // 两列布局
    const colX = [40, 320]
    const colWidth = 260
    let col = 0
    let y = 800
    const drawLine = (text: string) => {
      const p = pdf.getPages()[pdf.getPages().length - 1]
      p.drawText(text.slice(0, 180), { x: colX[col], y, size: fontSize, font })
      y -= 14
      if (y < 80) {
        if (col === 0) {
          col = 1
          y = 800
        } else {
          // 新页并绘制页眉
          const np = pdf.addPage([595, 842])
          np.drawText(header, { x: 40, y: 820, size: 12, font })
          if (fontWarn) np.drawText(fontWarn, { x: 400, y: 820, size: 8, font })
          col = 0
          y = 800
        }
      }
    }
    const md = toMarkdown(parsed)
    for (const ln of md.split('\n')) drawLine(ln)
    // 页脚页码
    const pages = pdf.getPages()
    pages.forEach((p, i) => {
      p.drawText(`第 ${i + 1} 页`, { x: 520, y: 20, size: 9, font })
    })
    const bytes = await pdf.save()
    const name = buildName(req.body?.meta, 'pdf')
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${name}"`)
    res.send(Buffer.from(bytes))
  } catch (e: any) {
    res.status(400).json({ error: 'invalid_llm_output', message: e?.message || 'error' })
  }
})

router.post('/export/conversation', requireSession, async (req, res) => {
  try {
    const body = z.object({ messages: z.array(z.object({ role: z.string(), content: z.string(), ts: z.number().optional() })), meta: z.record(z.any()).optional(), format: z.enum(['json', 'markdown', 'pdf']).default('markdown') }).parse(req.body)
    const name = buildName(body.meta, body.format === 'json' ? 'json' : body.format === 'markdown' ? 'md' : 'pdf')
    if (body.format === 'json') {
      res.setHeader('Content-Disposition', `attachment; filename="${name}"`)
      return res.json(body)
    }
    const md = ['# 会话导出', body.messages.map((m) => `- ${m.role}: ${m.content}`).join('\n')].join('\n\n')
    if (body.format === 'markdown') {
      res.setHeader('Content-Type', 'text/markdown; charset=utf-8')
      res.setHeader('Content-Disposition', `attachment; filename="${name}"`)
      return res.send(md)
    }
    const pdf = await PDFDocument.create()
    pdf.registerFontkit(fontkit as any)
    let font
    try {
      if (env.PDF_FONT_PATH && fs.existsSync(path.resolve(process.cwd(), env.PDF_FONT_PATH))) {
        const buf = fs.readFileSync(path.resolve(process.cwd(), env.PDF_FONT_PATH))
        font = await pdf.embedFont(buf)
      } else {
        font = await pdf.embedFont(StandardFonts.Helvetica)
      }
    } catch {
      font = await pdf.embedFont(StandardFonts.Helvetica)
    }
    const page = pdf.addPage([595, 842])
    let y = 800
    for (const ln of md.split('\n')) {
      if (y < 40) {
        y = 800
        pdf.addPage([595, 842])
      }
      const p = pdf.getPages()[pdf.getPages().length - 1]
      p.drawText(ln.slice(0, 200), { x: 40, y, size: 10, font })
      y -= 14
    }
    const bytes = await pdf.save()
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${name}"`)
    res.send(Buffer.from(bytes))
  } catch (e: any) {
    res.status(400).json({ error: 'invalid_params', message: e?.message || 'error' })
  }
})
