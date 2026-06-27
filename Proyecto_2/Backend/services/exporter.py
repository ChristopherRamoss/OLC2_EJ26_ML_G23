import io
import numpy as np
import pandas as pd
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak,
)

def exportar_freelancers_segmentado(df_fl: pd.DataFrame, labels_fl) -> bytes:

    df = df_fl.copy()
    df["segmento"] = [int(l) if l >= 0 else -1 for l in labels_fl]
    return df.to_csv(index=False).encode("utf-8")


def exportar_resenas_segmentado(df_rv: pd.DataFrame, labels_rv) -> bytes:

    df = df_rv.copy()
    df["segmento"] = [int(l) if l >= 0 else -1 for l in labels_rv]
    return df.to_csv(index=False).encode("utf-8")


def exportar_resumen_estadistico(df_fl: pd.DataFrame, labels_fl,
                                  segmentos_fl: list) -> bytes:

    filas = []
    for seg in segmentos_fl:
        fila = {"segmento": f"Segmento {seg['id'] + 1}", "n_registros": seg["n"]}
        fila.update(seg["resumen"])
        filas.append(fila)
    df_res = pd.DataFrame(filas)
    return df_res.to_csv(index=False).encode("utf-8")


def exportar_metricas(resultado_fl=None, resultado_rv=None) -> bytes:

    filas = []
    if resultado_fl:
        m = resultado_fl.get("metricas", {})
        filas.append({
            "dataset":           "Freelancers",
            "algoritmo":         resultado_fl.get("algoritmo", "—"),
            "n_segmentos":       len(resultado_fl.get("segmentos", [])),
            "silhouette":        m.get("silhouette"),
            "davies_bouldin":    m.get("davies_bouldin"),
            "calinski_harabasz": m.get("calinski_harabasz"),
        })
    if resultado_rv:
        m = resultado_rv.get("metricas", {})
        filas.append({
            "dataset":           "Reseñas",
            "algoritmo":         resultado_rv.get("algoritmo", "—"),
            "n_segmentos":       len(resultado_rv.get("segmentos", [])),
            "silhouette":        m.get("silhouette"),
            "davies_bouldin":    m.get("davies_bouldin"),
            "calinski_harabasz": m.get("calinski_harabasz"),
        })
    df_m = pd.DataFrame(filas)
    return df_m.to_csv(index=False).encode("utf-8")



# para el PDF
def _color_seg(i):

    PALETA = [
        colors.HexColor("#58a6ff"),
        colors.HexColor("#3fb950"),
        colors.HexColor("#E8A838"),
        colors.HexColor("#bc8cff"),
        colors.HexColor("#f85149"),
    ]
    return PALETA[i % len(PALETA)]


def exportar_pdf(resultado_fl=None, resultado_rv=None) -> bytes:

    buffer = io.BytesIO()
    doc    = SimpleDocTemplate(
        buffer, pagesize=A4,
        leftMargin=2*cm, rightMargin=2*cm,
        topMargin=2*cm, bottomMargin=2*cm,
    )
    styles  = getSampleStyleSheet()
    NEGRO   = colors.HexColor("#0d1117")
    GRIS    = colors.HexColor("#8b949e")
    BLANCO  = colors.HexColor("#e6edf3")
    AMBER   = colors.HexColor("#E8A838")
    BG_CARD = colors.HexColor("#161b22")

    h1 = ParagraphStyle("h1", parent=styles["Heading1"], textColor=BLANCO,   fontSize=20, spaceAfter=6)
    h2 = ParagraphStyle("h2", parent=styles["Heading2"], textColor=AMBER,    fontSize=14, spaceAfter=4)
    h3 = ParagraphStyle("h3", parent=styles["Heading3"], textColor=BLANCO,   fontSize=11, spaceAfter=3)
    bd = ParagraphStyle("bd", parent=styles["Normal"],   textColor=GRIS,     fontSize=9,  spaceAfter=6, leading=14)

    story = []

    # Portada 
    story.append(Spacer(1, 3*cm))
    story.append(Paragraph("TalentMosaic", h1))
    story.append(Paragraph("Reporte de Segmentación", h2))
    story.append(Paragraph("OLC2 · USAC · Vacaciones Junio 2026", bd))
    story.append(Spacer(1, 1*cm))

    def tabla_segmentos(segmentos, columnas):

        cabecera = ["Segmento", "Registros"] + [c.replace("_", " ").title() for c in columnas]
        filas    = [cabecera]
        for seg in segmentos:
            fila = [
                f"Segmento {seg['id'] + 1}",
                str(seg["n"]),
            ] + [str(seg["resumen"].get(c, "—")) for c in columnas]
            filas.append(fila)

        t = Table(filas, repeatRows=1)
        estilo = [
            ("BACKGROUND",  (0, 0), (-1, 0),  BG_CARD),
            ("TEXTCOLOR",   (0, 0), (-1, 0),  AMBER),
            ("FONTSIZE",    (0, 0), (-1, -1), 8),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.HexColor("#0d1117"), colors.HexColor("#1c2230")]),
            ("TEXTCOLOR",   (0, 1), (-1, -1), BLANCO),
            ("GRID",        (0, 0), (-1, -1), 0.3, colors.HexColor("#21262d")),
            ("ALIGN",       (1, 0), (-1, -1), "CENTER"),
            ("VALIGN",      (0, 0), (-1, -1), "MIDDLE"),
            ("TOPPADDING",  (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ]
        for i, seg in enumerate(segmentos):
            c = _color_seg(seg["id"])
            estilo.append(("TEXTCOLOR", (0, i + 1), (0, i + 1), c))
            estilo.append(("FONTNAME",  (0, i + 1), (0, i + 1), "Helvetica-Bold"))
        t.setStyle(TableStyle(estilo))
        return t

    # Sección Freelancers 
    if resultado_fl:
        story.append(PageBreak())
        story.append(Paragraph("Segmentación de Freelancers", h2))
        story.append(Paragraph(
            f"Algoritmo: <b>{resultado_fl['algoritmo'].upper()}</b> · "
            f"Segmentos: <b>{len(resultado_fl['segmentos'])}</b> · "
            f"Total registros: <b>{resultado_fl['total']:,}</b>",
            bd
        ))
        story.append(Spacer(1, 0.3*cm))

        story.append(Paragraph("Resumen por Segmento", h3))
        story.append(tabla_segmentos(resultado_fl["segmentos"], resultado_fl["columnas_resumen"]))
        story.append(Spacer(1, 0.5*cm))

        story.append(Paragraph("Descripción de Segmentos", h3))
        for seg in resultado_fl["segmentos"]:
            c = _color_seg(seg["id"])
            story.append(Paragraph(
                f'<font color="{c.hexval()}"><b>Segmento {seg["id"] + 1}</b></font> — {seg["descripcion"]}',
                bd
            ))

    # Sección Reseñas 
    if resultado_rv:
        story.append(PageBreak())
        story.append(Paragraph("Segmentación de Reseñas", h2))
        story.append(Paragraph(
            f"Algoritmo: <b>{resultado_rv['algoritmo'].upper()}</b> · "
            f"Segmentos: <b>{len(resultado_rv['segmentos'])}</b> · "
            f"Total registros: <b>{resultado_rv['total']:,}</b>",
            bd
        ))
        story.append(Spacer(1, 0.3*cm))

        story.append(Paragraph("Resumen por Segmento", h3))
        story.append(tabla_segmentos(resultado_rv["segmentos"], resultado_rv["columnas_resumen"]))
        story.append(Spacer(1, 0.5*cm))

        story.append(Paragraph("Términos Frecuentes por Segmento", h3))
        for seg in resultado_rv["segmentos"]:
            c    = _color_seg(seg["id"])
            tops = ", ".join(p["word"] for p in seg.get("palabras_clave", [])[:10])
            story.append(Paragraph(
                f'<font color="{c.hexval()}"><b>Segmento {seg["id"] + 1}:</b></font> {tops}',
                bd
            ))
        story.append(Spacer(1, 0.5*cm))

        story.append(Paragraph("Descripción de Segmentos", h3))
        for seg in resultado_rv["segmentos"]:
            c = _color_seg(seg["id"])
            story.append(Paragraph(
                f'<font color="{c.hexval()}"><b>Segmento {seg["id"] + 1}</b></font> — {seg["descripcion"]}',
                bd
            ))

    # Métricas 
    story.append(PageBreak())
    story.append(Paragraph("Métricas de Validación", h2))

    for dataset_label, resultado in [("Freelancers", resultado_fl), ("Reseñas", resultado_rv)]:
        if not resultado:
            continue
        m = resultado.get("metricas", {})
        story.append(Paragraph(dataset_label, h3))
        filas = [
            ["Métrica",             "Valor",    "Interpretación"],
            ["Silhouette Score",    str(m.get("silhouette",        "—")), "Mayor es mejor. Rango: -1 a 1."],
            ["Davies-Bouldin",      str(m.get("davies_bouldin",    "—")), "Menor es mejor. Rango: ≥ 0."],
            ["Calinski-Harabasz",   str(m.get("calinski_harabasz", "—")), "Mayor es mejor. Rango: ≥ 0."],
        ]
        t = Table(filas, colWidths=[5*cm, 3*cm, 9*cm], repeatRows=1)
        t.setStyle(TableStyle([
            ("BACKGROUND",  (0, 0), (-1, 0),  BG_CARD),
            ("TEXTCOLOR",   (0, 0), (-1, 0),  AMBER),
            ("FONTSIZE",    (0, 0), (-1, -1), 8),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.HexColor("#0d1117"), colors.HexColor("#1c2230")]),
            ("TEXTCOLOR",   (0, 1), (-1, -1), BLANCO),
            ("GRID",        (0, 0), (-1, -1), 0.3, colors.HexColor("#21262d")),
            ("VALIGN",      (0, 0), (-1, -1), "MIDDLE"),
            ("TOPPADDING",  (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ]))
        story.append(t)
        story.append(Spacer(1, 0.4*cm))

    doc.build(story)
    return buffer.getvalue()