"""Writes the Blender pipeline configs of the lab devices and teardown parts (2026-10 batch).

    python scripts/blender/make-device-configs.py

One config per raw Sketchfab download in assets-src/sketchfab/devices/
(ASSET_MANIFEST.md lists the sources): canonical pose (front -Y in Blender,
base on the ground), real size in metres, logos removed (texture rects filled
with the surrounding colour, logo meshes dropped) and, for the teardowns,
named parts the site moves one by one. Outputs go to
assets-src/blender/products/<id>.glb; `npm run assets:optimize -- products <id>`
builds the three web levels.
"""
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "configs", "products")
SRC = "assets-src/sketchfab/devices/"


def paint(image, *rects, color=None):
    rule = {"image": image, "rects": [list(r) for r in rects]}
    if color:
        rule["color"] = color
    return rule


def config(pid, src, *, rotate=0, real=None, remove=(), paints=(), rename=None, matpaint=(), parts=None, loose=False, weld=1e-5, desc=""):
    cfg = {
        "name": pid,
        "description": desc or f"Lab device model ({src}), canonical pose, real size, logos removed.",
        "input": SRC + src + ".glb",
        "output": f"assets-src/blender/products/{pid}.glb",
        "rotate": rotate,
        "cleanup": {"removeInvisible": True, "weldDistance": weld, "remove": list(remove), "paint": list(paints)},
        "materials": {"rename": rename or {}, "paint": list(matpaint)},
        "parts": parts or [{"id": "body", "fallback": True}],
        "ports": [],
        "preview": {"assembled": f"assets-src/blender/products/{pid}.jpg"},
    }
    if real is not None:
        cfg["realSize"] = real
    if loose:
        cfg["cleanup"]["separateLoose"] = True
    return cfg


def BLANK(image):
    """Screens: the download's own screenshot is replaced (the site maps its wallpaper on `Screen`)."""
    return paint(image, (0, 0, 1, 1), color="#0b1220")


def box(lo, hi):
    return {"min": list(lo), "max": list(hi)}


CONFIGS = [
    # ── print & media ──
    config("dev-printer-3d", "printer_3d", real=[0, 0, 0.5]),
    config("dev-printer-laser", "printer_laser", paints=[paint("Image_0", (0.795, 0.805, 0.865, 0.885), (0.845, 0.915, 0.885, 0.995))]),
    config("dev-printer-inkjet", "printer_inkjet", remove=[{"groups": "^CANON-Logo"}]),
    config("dev-interactive-panel", "interactive_panel", rotate=-90, real=[1.49, 0, 0], rename={"^black_glossy$": "Screen"}),
    # ── network & power ──
    config("dev-router", "router", rotate=90, real=[0.3, 0, 0], paints=[paint("Image_0", (0.425, 0.21, 0.495, 0.50))]),
    config("dev-switch", "switch", real=[0.1, 0, 0], remove=[{"groups": "^Text", "materials": "^material_0$"}]),
    config("dev-modem", "modem", paints=[paint("Image_3", (0.765, 0.20, 0.805, 0.33))]),
    config("dev-wifi-adapter", "wifi_adapter", paints=[
        paint("Image_1", (0.63, 0.495, 0.87, 0.61), color="#ffffff"),
        paint("Image_0", (0.0, 0.0, 0.64, 0.36), color="#f4f4f4"),
        paint("Image_0", (0.03, 0.83, 0.36, 0.98)),
    ]),
    config("dev-nic", "nic", real=0.12),
    config("dev-nas", "nas", real=[0.2, 0, 0]),
    config("dev-server-rack", "server_rack", real=[0.6, 0.6, 1.6]),
    config("dev-ups", "ups", paints=[paint("Image_0", (0.07, 0.875, 0.215, 0.945), (0.105, 0.94, 0.185, 1.0), (0.205, 0.885, 0.295, 0.965)), paint("Image_0", (0.67, 0.955, 0.87, 1.0), (0.605, 0.845, 0.685, 0.885), color="#f2f2f2")]),
    config("dev-usb-hub", "usb_hub", real=0.27),
    # ── storage ──
    config("dev-hdd", "storage_set", real=[0.1016, 0.147, 0.026], remove=[{"groups": "^(Cube_3|Cube\\.001_4|Samsung Evo 860)"}], paints=[
        paint("Image_5", (0.33, 0.315, 0.63, 0.375), (0.255, 0.385, 0.75, 0.455), (0.32, 0.465, 0.68, 0.73)),
        paint("Image_5", (0.33, 0.855, 0.67, 0.945)),
        paint("Image_6", (0.255, 0.095, 0.665, 0.335), (0.26, 0.395, 0.535, 0.475), (0.535, 0.395, 0.67, 0.56), color="#f6f6f6"),
        paint("Image_6", (0.375, 0.555, 0.625, 0.715), (0.30, 0.72, 0.625, 0.795)),
    ]),
    config("dev-usb-flash", "usb_flash", real=0.06, paints=[paint("Image_0", (0.055, 0.095, 0.205, 0.155), (0.055, 0.725, 0.205, 0.80))]),
    config("dev-sd-card", "sd_card", real=0.032, paints=[
        paint("Image_0", (0.09, 0.035, 0.67, 0.185), color="#e8352a"),
        paint("Image_0", (0.06, 0.805, 0.71, 0.925), (0.06, 0.92, 0.40, 0.99), (0.46, 0.615, 0.71, 0.755), color="#0b0b10"),
    ]),
    config("dev-external-drive", "external_drive", real=0.125, paints=[paint("Image_0", (0.495, 0.06, 0.585, 0.145), (0.515, 0.305, 0.575, 0.515))]),
    config("dev-optical-disc", "optical_disc", rotate=[["X", 63]], real=0.12),
    config("dev-thermal-paste", "thermal_paste", rotate=[["Y", 90]], real=[0.075, 0, 0]),
    # ── input / output ──
    config("dev-gamepad", "gamepad", rotate=[["X", -90]], real=0.153, paints=[paint("Image_0", (0.615, 0.915, 0.715, 1.0), color="#2b2b2b")]),
    config("dev-graphics-tablet", "graphics_tablet", rotate=90, real=0.23, paints=[paint("Image_0", (0.695, 0.785, 0.785, 0.825), (0.815, 0.6, 0.875, 0.635))]),
    config("dev-microphone", "microphone"),
    config("dev-webcam", "webcam", real=[0, 0, 0.1]),
    # ── mobile ──
    config("dev-smartwatch", "smartwatch", real=0.1, rename={"^screen$": "Screen"}),
    config("dev-sbc", "sbc", real=0.085, paints=[paint("Image_0", (0.285, 0.865, 0.61, 0.925)), paint("Image_0", (0.265, 0.725, 0.385, 0.835), color="#1e1e20")]),
    config("dev-smartphone", "smartphone", rotate=[["Y", -90], ["Z", 90]], real=0.158, rename={"^Screen$": "CameraGlass", "^Screen_Animada$": "Screen"}, paints=[BLANK("Image_0")]),
    config(
        "dev-tablet", "tablet", real=[0.1741, 0, 0.2506],
        remove=[{"materials": "^(lIbmhnHcRxCyKTH|WiLZDKmGOAGYwwJ)$"}],
        rename={"^eTUqMdUiJziCRoV$": "Screen"},
        paints=[BLANK("Image_11")],
        parts=[{"id": "display", "rules": [{"center": box([-1, -1, -1], [1, -0.0005, 1])}]}, {"id": "housing", "fallback": True}],
        desc="Tablet (iPad-style, logos removed): `display` (front glass and panel) and `housing`, for the exhibit and the teardown.",
    ),
    config(
        "dev-laptop", "laptop", rotate=-90, real=[0.36, 0, 0],
        rename={"^Material\\.004$": "Screen"},
        paints=[paint("Image_4", (0.015, 0.815, 0.085, 0.905), (0.095, 0.145, 0.135, 0.185)), BLANK("Image_0")],
        parts=[{"id": "lid", "rules": [{"groups": "^Cube\\.001"}]}, {"id": "base", "fallback": True}],
        desc="15.6-inch laptop (logos removed): `lid` (display) and `base`, for the exhibit and the teardown.",
    ),
    config(
        "dev-all-in-one", "all_in_one", real=[0.547, 0, 0],
        paints=[paint("Image_0", (0.10, 0.10, 0.76, 0.39), (0.37, 0.63, 0.63, 0.70), color="#ffffff")],
        parts=[
            {"id": "stand", "rules": [{"groups": "^Stand"}]},
            {"id": "keyboard", "rules": [{"groups": "^Keyboard"}]},
            {"id": "mouse", "rules": [{"groups": "^Mouse"}]},
            {"id": "back_cover", "rules": [{"objects": "^Body_PCBody"}]},
            {"id": "body", "fallback": True},
        ],
        desc="24-inch all-in-one with keyboard and mouse (logos removed): parts for the exhibit and the teardown.",
    ),
    # ── teardown internals ──
    config(
        "td-phone", "phone_teardown", rotate=[["Z", -90], ["X", -90]], real=[0.0716, 0.1467, 0], loose=True, weld=0,
        remove=[{"materials": "^mat_metal$", "center": box([-0.004, 0.064, -0.0045], [0.004, 0.087, -0.0035])}],
        rename={"^mat_screen$": "Screen"},
        paints=[paint("Image_5", (0.87, 0.205, 0.91, 0.275)), paint("Image_5", (0.615, 0.475, 0.695, 0.565)), BLANK("Image_10")],
        parts=[
            {"id": "display", "rules": [{"center": box([-1, -1, 0.0024], [1, 1, 1])}]},
            {"id": "sim_tray", "rules": [{"center": box([-1, 0.026, -1], [-0.0333, 0.044, 1]), "size": {"max": [1, 0.02, 1]}}]},
            {"id": "cameras", "rules": [{"center": box([0.014, 0.106, -0.0062], [0.034, 0.146, 0.0024])}]},
            {"id": "battery", "rules": [{"center": box([-0.0135, 0.021, -0.0031], [0.032, 0.107, 0.0024]), "size": {"max": [0.046, 0.088, 0.01]}}]},
            {"id": "vibration", "rules": [{"center": box([-0.031, 0.009, -0.0031], [-0.007, 0.022, 0.0024])}]},
            {"id": "speaker", "rules": [{"center": box([0.009, 0.005, -0.0031], [0.030, 0.022, 0.0024])}]},
            {"id": "usb_port", "rules": [{"center": box([-0.006, 0.0, -0.0031], [0.006, 0.009, 0.0024])}]},
            {
                "id": "mainboard",
                "rules": [
                    {"center": box([-0.032, 0.100, -0.0031], [0.015, 0.146, 0.0024]), "size": {"max": [0.05, 0.05, 0.01]}},
                    {"center": box([-0.032, 0.046, -0.0031], [-0.013, 0.100, 0.0024]), "size": {"max": [0.05, 0.06, 0.01]}},
                ],
            },
            {"id": "frame", "fallback": True},
        ],
        desc="6.1-inch phone teardown (iPhone 12 model, logos removed), lying face up (+Z screen, +Y top edge): named internal parts.",
    ),
    config("td-laptop-fan", "laptop_fan", remove=[{"groups": "\\.005$"}], desc="Laptop blower fan (the assembled one of the download), lying flat."),
    config("td-laptop-battery", "laptop_battery", rotate=[104.93, 149.74, 5.18], real=[0.23, 0, 0], desc="Flat laptop battery pack, lying label up."),
    config("td-sodimm", "sodimm", rotate=[["Y", -90]], real=[0.03, 0.0696, 0],
           paints=[paint("Image_0", (0.095, 0.375, 0.245, 0.435)), paint("Image_0", (0.835, 0.035, 0.955, 0.085))],
           desc="SO-DIMM DDR4 memory module, component side up."),
    config("td-board", "pcb_board", desc="Densely populated circuit board (chips, capacitors), base for the laptop and all-in-one boards."),
    config(
        "td-components", "electronic_components",
        parts=[
            {"id": "inductor", "rules": [{"groups": "^Inductor"}]},
            {"id": "cap_cyl", "rules": [{"groups": "^Capacitor-Cylindrical"}]},
            {"id": "cap_film", "rules": [{"groups": "^Capacitor-Film"}]},
            {"id": "cap_ceramic", "rules": [{"groups": "^Capacitor-Ceramic"}]},
            {"id": "to220", "rules": [{"groups": "^TO-220"}]},
            {"id": "to92", "rules": [{"groups": "^TO-92"}]},
            {"id": "resistor", "rules": [{"groups": "^Resistor"}]},
            {"id": "diode", "rules": [{"groups": "^Diode-Switching"}]},
            {"id": "led", "rules": [{"groups": "^Diode-Light"}]},
            {"id": "button", "rules": [{"groups": "^Button"}]},
            {"id": "breadboard", "fallback": True},
        ],
        desc="Through-hole electronic components (inductor, capacitors, regulators…) as separate nodes, to populate boards.",
    ),
]

os.makedirs(OUT, exist_ok=True)
for c in CONFIGS:
    with open(os.path.join(OUT, c["name"] + ".json"), "w", encoding="utf-8", newline="\n") as f:
        json.dump(c, f, indent=2, ensure_ascii=False)
        f.write("\n")
print(f"{len(CONFIGS)} configs -> {os.path.relpath(OUT)}")
