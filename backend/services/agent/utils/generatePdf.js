// pdfkit is CommonJS - PDFDocument is its default export, not a named one
import PDFDocument from "pdfkit"

const INK = "#111827"
const BODY = "#1f2937"
const MUTED = "#6b7280"
const ACCENT = "#6366f1"
const RULE = "#c9ced6"

/**
 * data shape:
 * { title, subtitle, author, sections: [ { heading, paragraphs: [], points: [] } ] }
 * coverImage is an optional Buffer rendered on the title page.
 */
export const generatePdf = async (data, coverImage = null) => {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({
            size: "A4",
            margin: 64,
            bufferPages: true,
            info: {
                Author: data?.author || "AmeekAI",
                Title: data?.title ?? "Untitled",
                Creator: "AmeekAI"
            }
        })

        const chunks = []
        doc.on("data", (chunk) => chunks.push(chunk))
        doc.on("end", () => resolve(Buffer.concat(chunks)))
        doc.on("error", reject)

        const left = doc.page.margins.left
        const right = doc.page.width - doc.page.margins.right
        const width = right - left
        const centre = doc.page.width / 2

        const shortRule = (y, w = 210) => {
            doc.save()
                .moveTo(centre - w / 2, y).lineTo(centre + w / 2, y)
                .lineWidth(0.9).stroke(INK).restore()
        }

        // ---------- title page -------------------------------------------
        doc.y = 132

        doc.fillColor(INK).font("Times-Bold").fontSize(20)
            .text(data?.title ?? "Untitled", left, doc.y, {
                width, align: "center", lineGap: 6
            })

        doc.moveDown(0.9)
        shortRule(doc.y)

        if (coverImage) {
            try {
                doc.image(coverImage, centre - 115, doc.y + 34, {
                    fit: [230, 230], align: "center"
                })
                doc.y = doc.y + 34 + 230
            } catch {
                // an unreadable buffer must not lose the whole document
                doc.y = doc.y + 20
            }
        } else {
            doc.y = doc.y + 150
        }

        doc.y = Math.max(doc.y + 46, 560)
        shortRule(doc.y)
        doc.y += 26

        if (data?.author) {
            doc.fillColor(BODY).font("Times-Roman").fontSize(10.5)
                .text(data.author, left, doc.y, { width, align: "center" })
            doc.moveDown(1.1)
        }

        if (data?.subtitle) {
            doc.fillColor(ACCENT).font("Times-Roman").fontSize(10.5)
                .text(data.subtitle, left, doc.y, { width, align: "center" })
            doc.moveDown(1.1)
        }

        doc.fillColor(MUTED).font("Times-Roman").fontSize(10)
            .text(
                new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" }),
                left, doc.y, { width, align: "center" }
            )

        // ---------- body --------------------------------------------------
        const sections = Array.isArray(data?.sections) ? data.sections : []

        if (sections.length) doc.addPage()

        sections.forEach((s, i) => {
            if (doc.y > doc.page.height - doc.page.margins.bottom - 110) doc.addPage()

            doc.moveDown(i === 0 ? 0 : 1.3)

            const headingY = doc.y
            doc.fillColor(INK).font("Times-Bold").fontSize(14.5)
                .text(String(i + 1), left, headingY, { width: 24, lineBreak: false })
            doc.fillColor(INK).font("Times-Bold").fontSize(14.5)
                .text(s?.heading ?? "", left + 26, headingY, { width: width - 26 })

            doc.moveDown(0.7)

            const paragraphs = Array.isArray(s?.paragraphs) ? s.paragraphs : []
            paragraphs.forEach((p) => {
                doc.fillColor(BODY).font("Times-Roman").fontSize(10.5)
                    .text(String(p ?? ""), left, doc.y, {
                        width, align: "justify", indent: 18, lineGap: 2.6
                    })
                doc.moveDown(0.55)
            })

            const points = Array.isArray(s?.points) ? s.points : []
            if (points.length) doc.moveDown(0.2)

            points.forEach((p) => {
                if (doc.y > doc.page.height - doc.page.margins.bottom - 34) doc.addPage()

                const bulletY = doc.y
                doc.save().circle(left + 20, bulletY + 5, 1.6).fill(ACCENT).restore()
                doc.fillColor(BODY).font("Times-Roman").fontSize(10.5)
                    .text(String(p ?? ""), left + 30, bulletY, {
                        width: width - 30, lineGap: 2.6
                    })
                doc.moveDown(0.4)
            })
        })

        // ---------- page numbers (body pages only) ------------------------
        const range = doc.bufferedPageRange()

        for (let i = 1; i < range.count; i++) {
            doc.switchToPage(range.start + i)
            doc.page.margins.bottom = 0

            doc.fillColor(MUTED).font("Times-Roman").fontSize(9.5)
                .text(String(i), left, doc.page.height - 46, {
                    width, align: "center", lineBreak: false
                })
        }

        doc.end()
    })
}
