#!/bin/bash
# Reptile Lord - Method 3: Braille Characters (Highest Resolution)
# Each cell = 2×4 dots (8 subpixels per cell!)
#
# Braille dot numbering:
#   1 4
#   2 5
#   3 6
#   7 8
#
# Character = U+2800 + sum of dot values
# dot1=1, dot2=2, dot3=4, dot4=8, dot5=16, dot6=32, dot7=64, dot8=128
#
# Limitation: Single color per character (foreground only, no per-dot colors)
# Best for: Silhouettes, outlines, high-detail monochrome sprites

clear
echo ""
echo "  ╔═══════════════════════════════════════════════════════════════════════════╗"
echo "  ║          REPTILE LORD - BRAILLE METHOD (2×4 dots/cell = 8 subpixels)      ║"
echo "  ╚═══════════════════════════════════════════════════════════════════════════╝"
echo ""

# Color function (foreground only for braille)
fg() {
    echo -en "\033[38;2;$1;$2;$3m"
}
X="\033[0m"

# Common braille characters reference:
# ⣿ = full (255)     ⠀ = empty (0)
# ⡇ = left col (71)  ⢸ = right col (184)
# ⠉ = top row (9)    ⣀ = bottom row (192)
# ⠛ = top 2 rows (27) ⣤ = bottom 2 rows (228)
# ⡿ = all but top-right (127)  ⣾ = all but top-left (254)
# ⣷ = all but bottom-right (247)  ⣯ = all but bottom-left (239)

echo "  ┌─────────────────────────────────────────────────────────────────────────┐"
echo "  │  MONOCHROME SILHOUETTES - Maximum Detail                               │"
echo "  └─────────────────────────────────────────────────────────────────────────┘"
echo ""

# Green reptile lord
G="0 200 100"

echo -en "  "
echo -en "$(fg $G)"
# IDLE POSE - 10 cells wide x 8 cells tall = 20×32 "dots"
echo "    IDLE              ATTACK             WALK LEFT          WALK RIGHT"
echo ""

# Row 1: Horns
echo -en "  $(fg $G)"
echo -en "  ⢀⣴⣾⣷⣦⡀  "
echo -en "    "
echo -en "⢀⣴⣾⣿⣷⣦⡀  "
echo -en "    "
echo -en "  ⢀⣴⣾⣷⣦⡀  "
echo -en "    "
echo -en "  ⢀⣴⣾⣷⣦⡀  "
echo -e "${X}"

# Row 2: Upper head
echo -en "  $(fg $G)"
echo -en " ⣼⣿⡟⠛⢻⣿⣧ "
echo -en "    "
echo -en "⣼⣿⡟⠿⠿⢻⣿⣧ "
echo -en "    "
echo -en " ⣼⣿⡟⠛⢻⣿⣧ "
echo -en "    "
echo -en " ⣼⣿⡟⠛⢻⣿⣧ "
echo -e "${X}"

# Row 3: Eyes and snout
echo -en "  $(fg $G)"
echo -en " ⣿⣿⣿⣶⣶⣿⣿⣿ "
echo -en "    "
echo -en "⣿⣿⣿⣭⣭⣿⣿⣿ "
echo -en "    "
echo -en " ⣿⣿⣿⣶⣶⣿⣿⣿ "
echo -en "    "
echo -en " ⣿⣿⣿⣶⣶⣿⣿⣿ "
echo -e "${X}"

# Row 4: Lower head/jaw
echo -en "  $(fg $G)"
echo -en "  ⠹⣿⣿⣿⣿⠏  "
echo -en "    "
echo -en " ⠹⣿⣿⣿⣿⣿⠏  "
echo -en "    "
echo -en "  ⠹⣿⣿⣿⣿⠏  "
echo -en "    "
echo -en "  ⠹⣿⣿⣿⣿⠏  "
echo -e "${X}"

# Row 5: Neck/shoulders
echo -en "  $(fg $G)"
echo -en "   ⣿⣿⣿⣿⣿   "
echo -en "    "
echo -en "  ⢸⣿⣿⣿⣿⡇  "
echo -en "    "
echo -en "   ⣿⣿⣿⣿⣿   "
echo -en "    "
echo -en "   ⣿⣿⣿⣿⣿   "
echo -e "${X}"

# Row 6: Arms/torso
echo -en "  $(fg $G)"
echo -en " ⣼⣿⣿⣿⣿⣿⣿⣧ "
echo -en "    "
echo -en "⣿⡿⣿⣿⣿⣿⣿⢿⣿"
echo -en "    "
echo -en "⣀⣿⣿⣿⣿⣿⣿⣿  "
echo -en "    "
echo -en "  ⣿⣿⣿⣿⣿⣿⣿⣀"
echo -e "${X}"

# Row 7: Lower torso
echo -en "  $(fg $G)"
echo -en " ⠸⣿⣿⣿⣿⣿⣿⠇ "
echo -en "    "
echo -en "⠈⠃⣿⣿⣿⣿⣿⠘⠁"
echo -en "    "
echo -en "  ⣿⣿⣿⣿⣿⣿⣿  "
echo -en "    "
echo -en "  ⣿⣿⣿⣿⣿⣿⣿  "
echo -e "${X}"

# Row 8: Hips
echo -en "  $(fg $G)"
echo -en "  ⢸⣿⣿⣿⣿⡇  "
echo -en "    "
echo -en "  ⣿⣿⣿⣿⣿⣿  "
echo -en "    "
echo -en "  ⠸⣿⣿⣿⣿⠇  "
echo -en "    "
echo -en "  ⠸⣿⣿⣿⣿⠇  "
echo -e "${X}"

# Row 9: Upper legs
echo -en "  $(fg $G)"
echo -en "  ⢸⣿⠁⠈⣿⡇  "
echo -en "    "
echo -en " ⣾⣿   ⣿⣷ "
echo -en "    "
echo -en "  ⣿⣿  ⣿⣷  "
echo -en "    "
echo -en "  ⣾⣿  ⣿⣿  "
echo -e "${X}"

# Row 10: Lower legs
echo -en "  $(fg $G)"
echo -en "  ⢸⣿  ⣿⡇  "
echo -en "    "
echo -en "⣸⣿⠇  ⠸⣿⣇"
echo -en "    "
echo -en "  ⣿⡇   ⣿⡇ "
echo -en "    "
echo -en " ⢸⣿   ⢸⣿  "
echo -e "${X}"

# Row 11: Feet
echo -en "  $(fg $G)"
echo -en "  ⣿⣿⡄⢠⣿⣿  "
echo -en "    "
echo -en "⣿⣿⠃  ⠘⣿⣿"
echo -en "    "
echo -en " ⣼⣿⡄  ⢠⣿⣧ "
echo -en "    "
echo -en " ⣼⣿⡄  ⢠⣿⣧ "
echo -e "${X}"

# Row 12: Claws
echo -en "  $(fg $G)"
echo -en "  ⠛⠛   ⠛⠛  "
echo -en "    "
echo -en "⠛⠛      ⠛⠛"
echo -en "    "
echo -en " ⠛⠃     ⠘⠛ "
echo -en "    "
echo -en " ⠛⠃     ⠘⠛ "
echo -e "${X}"

echo ""
echo ""

# Multi-colored version using background + foreground trick
echo "  ┌─────────────────────────────────────────────────────────────────────────┐"
echo "  │  COLORED VERSION - Using colored backgrounds behind braille            │"
echo "  └─────────────────────────────────────────────────────────────────────────┘"
echo ""

# For colored braille, we use:
# - Background color for the "off" dots
# - Foreground color for the "on" dots
# This gives us 2-color braille

cf() {
    echo -en "\033[38;2;$1;$2;$3m\033[48;2;$4;$5;$6m"
}

# Colors
SCALE="0 180 100"     # Green scales (foreground/dots)
BG="20 15 30"         # Dark purple background
EYE="255 220 0"       # Yellow eyes
BELLY="200 180 120"   # Tan underbelly

echo -en "  "
echo -en "$(cf $SCALE $BG)"
echo -en "  ⢀⣴⣾⣷⣦⡀  "
echo -e "${X}"

echo -en "  "
echo -en "$(cf $SCALE $BG)"
echo -en " ⣼⣿"
echo -en "$(cf $EYE $BG)⠿⠿"
echo -en "$(cf $SCALE $BG)⣿⣧ "
echo -e "${X}"

echo -en "  "
echo -en "$(cf $SCALE $BG)"
echo -en " ⣿⣿"
echo -en "$(cf $BELLY $BG)⣶⣶"
echo -en "$(cf $SCALE $BG)⣿⣿ "
echo -e "${X}"

echo -en "  "
echo -en "$(cf $SCALE $BG)"
echo -en "  ⠹⣿⣿⣿⣿⠏  "
echo -e "${X}"

echo -en "  "
echo -en "$(cf $SCALE $BG)"
echo -en "   ⣿"
echo -en "$(cf $BELLY $BG)⣿⣿"
echo -en "$(cf $SCALE $BG)⣿   "
echo -e "${X}"

echo -en "  "
echo -en "$(cf $SCALE $BG)"
echo -en " ⣼⣿"
echo -en "$(cf $BELLY $BG)⣿⣿"
echo -en "$(cf $SCALE $BG)⣿⣧ "
echo -e "${X}"

echo -en "  "
echo -en "$(cf $SCALE $BG)"
echo -en " ⠸⣿"
echo -en "$(cf $BELLY $BG)⣿⣿"
echo -en "$(cf $SCALE $BG)⣿⠇ "
echo -e "${X}"

echo -en "  "
echo -en "$(cf $SCALE $BG)"
echo -en "  ⢸⣿  ⣿⡇  "
echo -e "${X}"

echo -en "  "
echo -en "$(cf $SCALE $BG)"
echo -en "  ⣿⣿  ⣿⣿  "
echo -e "${X}"

echo -en "  "
echo -en "$(cf $SCALE $BG)"
echo -en "  ⠛⠛  ⠛⠛  "
echo -e "${X}"

echo ""
echo "  ┌─────────────────────────────────────────────────────────────────────────┐"
echo "  │  BRAILLE DOT PATTERN                                                    │"
echo "  ├─────────────────────────────────────────────────────────────────────────┤"
echo "  │    1 4     Values: 1=1, 2=2, 3=4, 4=8, 5=16, 6=32, 7=64, 8=128         │"
echo "  │    2 5     Character = U+2800 + sum(dot values)                         │"
echo "  │    3 6     Example: ⣿ = all dots = 1+2+4+8+16+32+64+128 = 255 = U+28FF │"
echo "  │    7 8                                                                  │"
echo "  └─────────────────────────────────────────────────────────────────────────┘"
echo ""
echo "  Resolution: 20×32 dots per sprite (10 cells × 8 rows, 2×4 dots per cell)"
echo "  Best for: High-detail silhouettes, outlines, retro terminal aesthetics"
echo ""
