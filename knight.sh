#!/bin/bash
# Knight in Armor v2 - Improved Detail
# Better proportions, sharper edges, ground shadow

clear

c() { echo -en "\033[38;2;$1;$2;$3m\033[48;2;$4;$5;$6m"; }
X="\033[0m"

echo ""
echo "  ╔═══════════════════════════════════════════════════════════════════════════════════╗"
echo "  ║              KNIGHT IN ARMOR v2 - IMPROVED DETAIL (Facing Down)                   ║"
echo "  ╚═══════════════════════════════════════════════════════════════════════════════════╝"
echo ""

# ═══════════════════════════════════════════════════════════════════════════════
# REFINED COLOR PALETTE
# ═══════════════════════════════════════════════════════════════════════════════

# Metal (more contrast)
M1="220 225 235"    # Brightest highlight
M2="170 175 185"    # Light
M3="120 125 135"    # Mid
M4="75 80 90"       # Dark
M5="40 42 50"       # Darkest

# Gold (richer)
G1="255 200 60"     # Bright gold
G2="180 140 40"     # Dark gold

# Cape (deeper blue)
C1="100 120 200"    # Light
C2="60 80 160"      # Mid
C3="35 50 120"      # Dark

# Plume (vibrant red)
P1="240 50 50"      # Bright
P2="180 30 30"      # Dark

# Shield (bold red with gold cross)
SH="180 40 40"      # Shield red
SHD="130 25 25"     # Shield dark

# Sword
SW="240 245 255"    # Blade bright
SWD="180 185 195"   # Blade shadow

# Shadow on ground
SD="0 0 0"

# Terrains
GR="40 95 40"       # Grass
ST="85 85 90"       # Stone
SA="170 150 110"    # Sand
WA="45 90 130"      # Water

echo "  ┌────────────────┐┌────────────────┐┌────────────────┐┌────────────────┐"
echo "  │  GRASS         ││  STONE         ││  SAND          ││  WATER         │"
echo "  └────────────────┘└────────────────┘└────────────────┘└────────────────┘"

# Unified knight drawing - 12 cells wide, tighter layout
# Each column: terrain bg, knight on top

# Row 1: Plume top
echo -en "  "
echo -en "$(c $P1 $GR)   ⢀⣴⣷⣦⡀   $(c $P1 $ST)   ⢀⣴⣷⣦⡀   $(c $P1 $SA)   ⢀⣴⣷⣦⡀   $(c $P1 $WA)   ⢀⣴⣷⣦⡀   "
echo -e "${X}"

# Row 2: Plume body
echo -en "  "
echo -en "$(c $P1 $GR)   $(c $P2 $GR)⣼$(c $P1 $GR)⣿⣿⣿⣿$(c $P2 $GR)⣧$(c $P1 $GR)   $(c $P1 $ST)   $(c $P2 $ST)⣼$(c $P1 $ST)⣿⣿⣿⣿$(c $P2 $ST)⣧$(c $P1 $ST)   $(c $P1 $SA)   $(c $P2 $SA)⣼$(c $P1 $SA)⣿⣿⣿⣿$(c $P2 $SA)⣧$(c $P1 $SA)   $(c $P1 $WA)   $(c $P2 $WA)⣼$(c $P1 $WA)⣿⣿⣿⣿$(c $P2 $WA)⣧$(c $P1 $WA)   "
echo -e "${X}"

# Row 3: Helmet crown with plume base
echo -en "  "
echo -en "$(c $M4 $GR)  ⣰$(c $M3 $GR)⣿$(c $P2 $GR)⣿⣿⣿⣿$(c $M3 $GR)⣿$(c $M4 $GR)⣆  $(c $M4 $ST)  ⣰$(c $M3 $ST)⣿$(c $P2 $ST)⣿⣿⣿⣿$(c $M3 $ST)⣿$(c $M4 $ST)⣆  $(c $M4 $SA)  ⣰$(c $M3 $SA)⣿$(c $P2 $SA)⣿⣿⣿⣿$(c $M3 $SA)⣿$(c $M4 $SA)⣆  $(c $M4 $WA)  ⣰$(c $M3 $WA)⣿$(c $P2 $WA)⣿⣿⣿⣿$(c $M3 $WA)⣿$(c $M4 $WA)⣆  "
echo -e "${X}"

# Row 4: Helmet dome - bright center
echo -en "  "
echo -en "$(c $M5 $GR) ⣼$(c $M4 $GR)⣿$(c $M3 $GR)⣿$(c $M2 $GR)⣿$(c $M1 $GR)⣿⣿$(c $M2 $GR)⣿$(c $M3 $GR)⣿$(c $M4 $GR)⣿$(c $M5 $GR)⣧ $(c $M5 $ST) ⣼$(c $M4 $ST)⣿$(c $M3 $ST)⣿$(c $M2 $ST)⣿$(c $M1 $ST)⣿⣿$(c $M2 $ST)⣿$(c $M3 $ST)⣿$(c $M4 $ST)⣿$(c $M5 $ST)⣧ $(c $M5 $SA) ⣼$(c $M4 $SA)⣿$(c $M3 $SA)⣿$(c $M2 $SA)⣿$(c $M1 $SA)⣿⣿$(c $M2 $SA)⣿$(c $M3 $SA)⣿$(c $M4 $SA)⣿$(c $M5 $SA)⣧ $(c $M5 $WA) ⣼$(c $M4 $WA)⣿$(c $M3 $WA)⣿$(c $M2 $WA)⣿$(c $M1 $WA)⣿⣿$(c $M2 $WA)⣿$(c $M3 $WA)⣿$(c $M4 $WA)⣿$(c $M5 $WA)⣧ "
echo -e "${X}"

# Row 5: Helmet back plate
echo -en "  "
echo -en "$(c $M5 $GR) ⣿$(c $M4 $GR)⣿$(c $M3 $GR)⣿$(c $M2 $GR)⣿$(c $M1 $GR)⣿⣿$(c $M2 $GR)⣿$(c $M3 $GR)⣿$(c $M4 $GR)⣿$(c $M5 $GR)⣿ $(c $M5 $ST) ⣿$(c $M4 $ST)⣿$(c $M3 $ST)⣿$(c $M2 $ST)⣿$(c $M1 $ST)⣿⣿$(c $M2 $ST)⣿$(c $M3 $ST)⣿$(c $M4 $ST)⣿$(c $M5 $ST)⣿ $(c $M5 $SA) ⣿$(c $M4 $SA)⣿$(c $M3 $SA)⣿$(c $M2 $SA)⣿$(c $M1 $SA)⣿⣿$(c $M2 $SA)⣿$(c $M3 $SA)⣿$(c $M4 $SA)⣿$(c $M5 $SA)⣿ $(c $M5 $WA) ⣿$(c $M4 $WA)⣿$(c $M3 $WA)⣿$(c $M2 $WA)⣿$(c $M1 $WA)⣿⣿$(c $M2 $WA)⣿$(c $M3 $WA)⣿$(c $M4 $WA)⣿$(c $M5 $WA)⣿ "
echo -e "${X}"

# Row 6: Gorget with gold trim
echo -en "  "
echo -en "$(c $M5 $GR) ⠸$(c $M4 $GR)⣿$(c $G1 $GR)⡿$(c $M2 $GR)⣿⣿⣿⣿$(c $G1 $GR)⢿$(c $M4 $GR)⣿$(c $M5 $GR)⠇ $(c $M5 $ST) ⠸$(c $M4 $ST)⣿$(c $G1 $ST)⡿$(c $M2 $ST)⣿⣿⣿⣿$(c $G1 $ST)⢿$(c $M4 $ST)⣿$(c $M5 $ST)⠇ $(c $M5 $SA) ⠸$(c $M4 $SA)⣿$(c $G1 $SA)⡿$(c $M2 $SA)⣿⣿⣿⣿$(c $G1 $SA)⢿$(c $M4 $SA)⣿$(c $M5 $SA)⠇ $(c $M5 $WA) ⠸$(c $M4 $WA)⣿$(c $G1 $WA)⡿$(c $M2 $WA)⣿⣿⣿⣿$(c $G1 $WA)⢿$(c $M4 $WA)⣿$(c $M5 $WA)⠇ "
echo -e "${X}"

# Row 7: Shoulders - wide pauldrons
echo -en "  "
echo -en "$(c $C3 $GR)⣴$(c $M4 $GR)⣿$(c $M3 $GR)⣿$(c $M2 $GR)⣿$(c $M1 $GR)⣿$(c $C2 $GR)⣿⣿$(c $M1 $GR)⣿$(c $M2 $GR)⣿$(c $M3 $GR)⣿$(c $M4 $GR)⣿$(c $C3 $GR)⣦$(c $C3 $ST)⣴$(c $M4 $ST)⣿$(c $M3 $ST)⣿$(c $M2 $ST)⣿$(c $M1 $ST)⣿$(c $C2 $ST)⣿⣿$(c $M1 $ST)⣿$(c $M2 $ST)⣿$(c $M3 $ST)⣿$(c $M4 $ST)⣿$(c $C3 $ST)⣦$(c $C3 $SA)⣴$(c $M4 $SA)⣿$(c $M3 $SA)⣿$(c $M2 $SA)⣿$(c $M1 $SA)⣿$(c $C2 $SA)⣿⣿$(c $M1 $SA)⣿$(c $M2 $SA)⣿$(c $M3 $SA)⣿$(c $M4 $SA)⣿$(c $C3 $SA)⣦$(c $C3 $WA)⣴$(c $M4 $WA)⣿$(c $M3 $WA)⣿$(c $M2 $WA)⣿$(c $M1 $WA)⣿$(c $C2 $WA)⣿⣿$(c $M1 $WA)⣿$(c $M2 $WA)⣿$(c $M3 $WA)⣿$(c $M4 $WA)⣿$(c $C3 $WA)⣦"
echo -e "${X}"

# Row 8: Pauldrons with spikes + cape
echo -en "  "
echo -en "$(c $C1 $GR)⣿$(c $M3 $GR)⣿$(c $G1 $GR)⣿$(c $M2 $GR)⣿$(c $M3 $GR)⣿$(c $C1 $GR)⣿⣿$(c $M3 $GR)⣿$(c $M2 $GR)⣿$(c $G1 $GR)⣿$(c $M3 $GR)⣿$(c $C1 $GR)⣿$(c $C1 $ST)⣿$(c $M3 $ST)⣿$(c $G1 $ST)⣿$(c $M2 $ST)⣿$(c $M3 $ST)⣿$(c $C1 $ST)⣿⣿$(c $M3 $ST)⣿$(c $M2 $ST)⣿$(c $G1 $ST)⣿$(c $M3 $ST)⣿$(c $C1 $ST)⣿$(c $C1 $SA)⣿$(c $M3 $SA)⣿$(c $G1 $SA)⣿$(c $M2 $SA)⣿$(c $M3 $SA)⣿$(c $C1 $SA)⣿⣿$(c $M3 $SA)⣿$(c $M2 $SA)⣿$(c $G1 $SA)⣿$(c $M3 $SA)⣿$(c $C1 $SA)⣿$(c $C1 $WA)⣿$(c $M3 $WA)⣿$(c $G1 $WA)⣿$(c $M2 $WA)⣿$(c $M3 $WA)⣿$(c $C1 $WA)⣿⣿$(c $M3 $WA)⣿$(c $M2 $WA)⣿$(c $G1 $WA)⣿$(c $M3 $WA)⣿$(c $C1 $WA)⣿"
echo -e "${X}"

# Row 9: Upper torso + cape + arms start
echo -en "  "
echo -en "$(c $C1 $GR)⣿$(c $C2 $GR)⣿$(c $M4 $GR)⣿$(c $M3 $GR)⣿$(c $C2 $GR)⣿$(c $C1 $GR)⣿⣿$(c $C2 $GR)⣿$(c $M3 $GR)⣿$(c $M4 $GR)⣿$(c $C2 $GR)⣿$(c $C1 $GR)⣿$(c $C1 $ST)⣿$(c $C2 $ST)⣿$(c $M4 $ST)⣿$(c $M3 $ST)⣿$(c $C2 $ST)⣿$(c $C1 $ST)⣿⣿$(c $C2 $ST)⣿$(c $M3 $ST)⣿$(c $M4 $ST)⣿$(c $C2 $ST)⣿$(c $C1 $ST)⣿$(c $C1 $SA)⣿$(c $C2 $SA)⣿$(c $M4 $SA)⣿$(c $M3 $SA)⣿$(c $C2 $SA)⣿$(c $C1 $SA)⣿⣿$(c $C2 $SA)⣿$(c $M3 $SA)⣿$(c $M4 $SA)⣿$(c $C2 $SA)⣿$(c $C1 $SA)⣿$(c $C1 $WA)⣿$(c $C2 $WA)⣿$(c $M4 $WA)⣿$(c $M3 $WA)⣿$(c $C2 $WA)⣿$(c $C1 $WA)⣿⣿$(c $C2 $WA)⣿$(c $M3 $WA)⣿$(c $M4 $WA)⣿$(c $C2 $WA)⣿$(c $C1 $WA)⣿"
echo -e "${X}"

# Row 10: Shield (left) + torso + sword hilt (right)
echo -en "  "
echo -en "$(c $C2 $GR)⣿$(c $SH $GR)⣿$(c $G1 $GR)⣿$(c $SH $GR)⣿$(c $C2 $GR)⣿$(c $C1 $GR)⣿⣿$(c $C2 $GR)⣿$(c $M3 $GR)⣿$(c $G2 $GR)⣿$(c $SW $GR)⡇$(c $C2 $GR)⣿$(c $C2 $ST)⣿$(c $SH $ST)⣿$(c $G1 $ST)⣿$(c $SH $ST)⣿$(c $C2 $ST)⣿$(c $C1 $ST)⣿⣿$(c $C2 $ST)⣿$(c $M3 $ST)⣿$(c $G2 $ST)⣿$(c $SW $ST)⡇$(c $C2 $ST)⣿$(c $C2 $SA)⣿$(c $SH $SA)⣿$(c $G1 $SA)⣿$(c $SH $SA)⣿$(c $C2 $SA)⣿$(c $C1 $SA)⣿⣿$(c $C2 $SA)⣿$(c $M3 $SA)⣿$(c $G2 $SA)⣿$(c $SW $SA)⡇$(c $C2 $SA)⣿$(c $C2 $WA)⣿$(c $SH $WA)⣿$(c $G1 $WA)⣿$(c $SH $WA)⣿$(c $C2 $WA)⣿$(c $C1 $WA)⣿⣿$(c $C2 $WA)⣿$(c $M3 $WA)⣿$(c $G2 $WA)⣿$(c $SW $WA)⡇$(c $C2 $WA)⣿"
echo -e "${X}"

# Row 11: Shield with cross + mid torso + sword blade
echo -en "  "
echo -en "$(c $C3 $GR)⣿$(c $SH $GR)⣿$(c $G1 $GR)⣿$(c $G1 $GR)⣿$(c $C2 $GR)⣿$(c $C1 $GR)⣿⣿$(c $C2 $GR)⣿$(c $M4 $GR)⣿$(c $SW $GR)⣿$(c $SW $GR)⡇$(c $C3 $GR)⣿$(c $C3 $ST)⣿$(c $SH $ST)⣿$(c $G1 $ST)⣿$(c $G1 $ST)⣿$(c $C2 $ST)⣿$(c $C1 $ST)⣿⣿$(c $C2 $ST)⣿$(c $M4 $ST)⣿$(c $SW $ST)⣿$(c $SW $ST)⡇$(c $C3 $ST)⣿$(c $C3 $SA)⣿$(c $SH $SA)⣿$(c $G1 $SA)⣿$(c $G1 $SA)⣿$(c $C2 $SA)⣿$(c $C1 $SA)⣿⣿$(c $C2 $SA)⣿$(c $M4 $SA)⣿$(c $SW $SA)⣿$(c $SW $SA)⡇$(c $C3 $SA)⣿$(c $C3 $WA)⣿$(c $SH $WA)⣿$(c $G1 $WA)⣿$(c $G1 $WA)⣿$(c $C2 $WA)⣿$(c $C1 $WA)⣿⣿$(c $C2 $WA)⣿$(c $M4 $WA)⣿$(c $SW $WA)⣿$(c $SW $WA)⡇$(c $C3 $WA)⣿"
echo -e "${X}"

# Row 12: Lower shield + fauld (waist) + sword
echo -en "  "
echo -en "$(c $C3 $GR)⠸$(c $SHD $GR)⣿$(c $SH $GR)⣿$(c $SHD $GR)⣿$(c $C2 $GR)⣿$(c $G1 $GR)⣤⣤$(c $C2 $GR)⣿$(c $M4 $GR)⣿$(c $SW $GR)⣿$(c $SWD $GR)⡇$(c $C3 $GR)⠇$(c $C3 $ST)⠸$(c $SHD $ST)⣿$(c $SH $ST)⣿$(c $SHD $ST)⣿$(c $C2 $ST)⣿$(c $G1 $ST)⣤⣤$(c $C2 $ST)⣿$(c $M4 $ST)⣿$(c $SW $ST)⣿$(c $SWD $ST)⡇$(c $C3 $ST)⠇$(c $C3 $SA)⠸$(c $SHD $SA)⣿$(c $SH $SA)⣿$(c $SHD $SA)⣿$(c $C2 $SA)⣿$(c $G1 $SA)⣤⣤$(c $C2 $SA)⣿$(c $M4 $SA)⣿$(c $SW $SA)⣿$(c $SWD $SA)⡇$(c $C3 $SA)⠇$(c $C3 $WA)⠸$(c $SHD $WA)⣿$(c $SH $WA)⣿$(c $SHD $WA)⣿$(c $C2 $WA)⣿$(c $G1 $WA)⣤⣤$(c $C2 $WA)⣿$(c $M4 $WA)⣿$(c $SW $WA)⣿$(c $SWD $WA)⡇$(c $C3 $WA)⠇"
echo -e "${X}"

# Row 13: Tassets + cape behind
echo -en "  "
echo -en "$(c $C3 $GR) ⠈$(c $C2 $GR)⠻$(c $M3 $GR)⣿$(c $M2 $GR)⣿$(c $M3 $GR)⣿⣿$(c $M2 $GR)⣿$(c $M3 $GR)⣿$(c $C2 $GR)⠟$(c $C3 $GR)⠁ $(c $C3 $ST) ⠈$(c $C2 $ST)⠻$(c $M3 $ST)⣿$(c $M2 $ST)⣿$(c $M3 $ST)⣿⣿$(c $M2 $ST)⣿$(c $M3 $ST)⣿$(c $C2 $ST)⠟$(c $C3 $ST)⠁ $(c $C3 $SA) ⠈$(c $C2 $SA)⠻$(c $M3 $SA)⣿$(c $M2 $SA)⣿$(c $M3 $SA)⣿⣿$(c $M2 $SA)⣿$(c $M3 $SA)⣿$(c $C2 $SA)⠟$(c $C3 $SA)⠁ $(c $C3 $WA) ⠈$(c $C2 $WA)⠻$(c $M3 $WA)⣿$(c $M2 $WA)⣿$(c $M3 $WA)⣿⣿$(c $M2 $WA)⣿$(c $M3 $WA)⣿$(c $C2 $WA)⠟$(c $C3 $WA)⠁ "
echo -e "${X}"

# Row 14: Upper legs (cuisses) - WIDER
echo -en "  "
echo -en "$(c $M5 $GR)  $(c $M4 $GR)⣿$(c $M3 $GR)⣿$(c $M2 $GR)⣿$(c $M3 $GR)⣿$(c $M5 $GR)  $(c $M4 $GR)⣿$(c $M3 $GR)⣿$(c $M2 $GR)⣿$(c $M3 $GR)⣿$(c $M5 $GR)  $(c $M5 $ST)  $(c $M4 $ST)⣿$(c $M3 $ST)⣿$(c $M2 $ST)⣿$(c $M3 $ST)⣿$(c $M5 $ST)  $(c $M4 $ST)⣿$(c $M3 $ST)⣿$(c $M2 $ST)⣿$(c $M3 $ST)⣿$(c $M5 $ST)  $(c $M5 $SA)  $(c $M4 $SA)⣿$(c $M3 $SA)⣿$(c $M2 $SA)⣿$(c $M3 $SA)⣿$(c $M5 $SA)  $(c $M4 $SA)⣿$(c $M3 $SA)⣿$(c $M2 $SA)⣿$(c $M3 $SA)⣿$(c $M5 $SA)  $(c $M5 $WA)  $(c $M4 $WA)⣿$(c $M3 $WA)⣿$(c $M2 $WA)⣿$(c $M3 $WA)⣿$(c $M5 $WA)  $(c $M4 $WA)⣿$(c $M3 $WA)⣿$(c $M2 $WA)⣿$(c $M3 $WA)⣿$(c $M5 $WA)  "
echo -e "${X}"

# Row 15: Knee guards (poleyns) with gold
echo -en "  "
echo -en "$(c $M5 $GR)  $(c $M4 $GR)⣿$(c $G1 $GR)⣿$(c $M2 $GR)⣿$(c $M4 $GR)⣿$(c $M5 $GR)  $(c $M4 $GR)⣿$(c $M2 $GR)⣿$(c $G1 $GR)⣿$(c $M4 $GR)⣿$(c $M5 $GR)  $(c $M5 $ST)  $(c $M4 $ST)⣿$(c $G1 $ST)⣿$(c $M2 $ST)⣿$(c $M4 $ST)⣿$(c $M5 $ST)  $(c $M4 $ST)⣿$(c $M2 $ST)⣿$(c $G1 $ST)⣿$(c $M4 $ST)⣿$(c $M5 $ST)  $(c $M5 $SA)  $(c $M4 $SA)⣿$(c $G1 $SA)⣿$(c $M2 $SA)⣿$(c $M4 $SA)⣿$(c $M5 $SA)  $(c $M4 $SA)⣿$(c $M2 $SA)⣿$(c $G1 $SA)⣿$(c $M4 $SA)⣿$(c $M5 $SA)  $(c $M5 $WA)  $(c $M4 $WA)⣿$(c $G1 $WA)⣿$(c $M2 $WA)⣿$(c $M4 $WA)⣿$(c $M5 $WA)  $(c $M4 $WA)⣿$(c $M2 $WA)⣿$(c $G1 $WA)⣿$(c $M4 $WA)⣿$(c $M5 $WA)  "
echo -e "${X}"

# Row 16: Greaves (shin) - WIDER
echo -en "  "
echo -en "$(c $M5 $GR)  $(c $M4 $GR)⣿$(c $M3 $GR)⣿$(c $M2 $GR)⣿$(c $M4 $GR)⣿$(c $M5 $GR)  $(c $M4 $GR)⣿$(c $M2 $GR)⣿$(c $M3 $GR)⣿$(c $M4 $GR)⣿$(c $M5 $GR)  $(c $M5 $ST)  $(c $M4 $ST)⣿$(c $M3 $ST)⣿$(c $M2 $ST)⣿$(c $M4 $ST)⣿$(c $M5 $ST)  $(c $M4 $ST)⣿$(c $M2 $ST)⣿$(c $M3 $ST)⣿$(c $M4 $ST)⣿$(c $M5 $ST)  $(c $M5 $SA)  $(c $M4 $SA)⣿$(c $M3 $SA)⣿$(c $M2 $SA)⣿$(c $M4 $SA)⣿$(c $M5 $SA)  $(c $M4 $SA)⣿$(c $M2 $SA)⣿$(c $M3 $SA)⣿$(c $M4 $SA)⣿$(c $M5 $SA)  $(c $M5 $WA)  $(c $M4 $WA)⣿$(c $M3 $WA)⣿$(c $M2 $WA)⣿$(c $M4 $WA)⣿$(c $M5 $WA)  $(c $M4 $WA)⣿$(c $M2 $WA)⣿$(c $M3 $WA)⣿$(c $M4 $WA)⣿$(c $M5 $WA)  "
echo -e "${X}"

# Row 17: Lower greaves
echo -en "  "
echo -en "$(c $M5 $GR)  $(c $M5 $GR)⢸$(c $M4 $GR)⣿$(c $M3 $GR)⣿$(c $M4 $GR)⣿$(c $M5 $GR)⡇$(c $M5 $GR) $(c $M5 $GR)⢸$(c $M4 $GR)⣿$(c $M3 $GR)⣿$(c $M4 $GR)⣿$(c $M5 $GR)⡇ $(c $M5 $ST)  $(c $M5 $ST)⢸$(c $M4 $ST)⣿$(c $M3 $ST)⣿$(c $M4 $ST)⣿$(c $M5 $ST)⡇$(c $M5 $ST) $(c $M5 $ST)⢸$(c $M4 $ST)⣿$(c $M3 $ST)⣿$(c $M4 $ST)⣿$(c $M5 $ST)⡇ $(c $M5 $SA)  $(c $M5 $SA)⢸$(c $M4 $SA)⣿$(c $M3 $SA)⣿$(c $M4 $SA)⣿$(c $M5 $SA)⡇$(c $M5 $SA) $(c $M5 $SA)⢸$(c $M4 $SA)⣿$(c $M3 $SA)⣿$(c $M4 $SA)⣿$(c $M5 $SA)⡇ $(c $M5 $WA)  $(c $M5 $WA)⢸$(c $M4 $WA)⣿$(c $M3 $WA)⣿$(c $M4 $WA)⣿$(c $M5 $WA)⡇$(c $M5 $WA) $(c $M5 $WA)⢸$(c $M4 $WA)⣿$(c $M3 $WA)⣿$(c $M4 $WA)⣿$(c $M5 $WA)⡇ "
echo -e "${X}"

# Row 18: Sabatons (feet)
echo -en "  "
echo -en "$(c $M5 $GR) ⣠$(c $M4 $GR)⣿$(c $M3 $GR)⣿$(c $M2 $GR)⣿$(c $M3 $GR)⣿$(c $M4 $GR)⣿$(c $M5 $GR)⣄$(c $M4 $GR)⣿$(c $M3 $GR)⣿$(c $M2 $GR)⣿$(c $M3 $GR)⣿$(c $M4 $GR)⣿$(c $M5 $GR)⣄ $(c $M5 $ST) ⣠$(c $M4 $ST)⣿$(c $M3 $ST)⣿$(c $M2 $ST)⣿$(c $M3 $ST)⣿$(c $M4 $ST)⣿$(c $M5 $ST)⣄$(c $M4 $ST)⣿$(c $M3 $ST)⣿$(c $M2 $ST)⣿$(c $M3 $ST)⣿$(c $M4 $ST)⣿$(c $M5 $ST)⣄ $(c $M5 $SA) ⣠$(c $M4 $SA)⣿$(c $M3 $SA)⣿$(c $M2 $SA)⣿$(c $M3 $SA)⣿$(c $M4 $SA)⣿$(c $M5 $SA)⣄$(c $M4 $SA)⣿$(c $M3 $SA)⣿$(c $M2 $SA)⣿$(c $M3 $SA)⣿$(c $M4 $SA)⣿$(c $M5 $SA)⣄ $(c $M5 $WA) ⣠$(c $M4 $WA)⣿$(c $M3 $WA)⣿$(c $M2 $WA)⣿$(c $M3 $WA)⣿$(c $M4 $WA)⣿$(c $M5 $WA)⣄$(c $M4 $WA)⣿$(c $M3 $WA)⣿$(c $M2 $WA)⣿$(c $M3 $WA)⣿$(c $M4 $WA)⣿$(c $M5 $WA)⣄ "
echo -e "${X}"

# Row 19: Ground shadow
echo -en "  "
echo -en "$(c $SD $GR)  ⠈⠉⠛⠛⠛⠛⠛⠛⠉⠁  $(c $SD $ST)  ⠈⠉⠛⠛⠛⠛⠛⠛⠉⠁  $(c $SD $SA)  ⠈⠉⠛⠛⠛⠛⠛⠛⠉⠁  $(c $SD $WA)  ⠈⠉⠛⠛⠛⠛⠛⠛⠉⠁  "
echo -e "${X}"

# Row 20: Terrain texture 1
echo -en "  "
echo -en "$(c 60 130 60 $GR)⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿$(c 105 105 110 $ST)⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿$(c 190 170 130 $SA)⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿$(c 70 120 160 $WA)⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿"
echo -e "${X}"

# Row 21: Terrain texture 2
echo -en "  "
echo -en "$(c 35 75 35 $GR)⢻⣛⣛⣻⢻⣛⣛⣻⢻⣛⣛⣻$(c 65 65 70 $ST)⣿⣤⣤⣿⣿⣤⣤⣿⣿⣤⣤⣿$(c 150 130 90 $SA)⣀⣠⣄⣀⣀⣠⣄⣀⣀⣠⣄⣀$(c 90 140 180 $WA)⢀⣠⣤⣀⢀⣠⣤⣀⢀⣠⣤⣀"
echo -e "${X}"

echo ""
echo "  ┌─────────────────────────────────────────────────────────────────────────────────────┐"
echo "  │  IMPROVEMENTS IN V2                                                                 │"
echo "  ├─────────────────────────────────────────────────────────────────────────────────────┤"
echo "  │  • Wider legs for better proportions                                                │"
echo "  │  • Larger feet (sabatons) for stability                                             │"
echo "  │  • Higher contrast metal shading (5 levels)                                         │"
echo "  │  • Cleaner gold trim on gorget and knees                                            │"
echo "  │  • Shield with visible gold cross pattern                                           │"
echo "  │  • Ground shadow for depth                                                          │"
echo "  │  • Tighter tile spacing                                                             │"
echo "  │  • Richer terrain textures                                                          │"
echo "  └─────────────────────────────────────────────────────────────────────────────────────┘"
echo ""
