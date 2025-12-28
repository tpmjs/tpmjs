#!/bin/bash
# Reptile Lord - Method 1: Half-Block Characters (▀ ▄)
# Each cell = 2 vertical pixels using foreground + background color
# ▀ = top pixel (foreground), bottom pixel (background)
# ▄ = bottom pixel (foreground), top pixel (background)
# Full block = both same color, space = both background

clear
echo ""
echo "  ╔═══════════════════════════════════════════════════════════════════════════╗"
echo "  ║          REPTILE LORD - HALF-BLOCK METHOD (2 vertical pixels/cell)        ║"
echo "  ╚═══════════════════════════════════════════════════════════════════════════╝"
echo ""

# Color function: fg;bg
# Usage: $(c 0 100 0 50 50 50) = green foreground, dark gray background
c() {
    echo -en "\033[38;2;$1;$2;$3m\033[48;2;$4;$5;$6m"
}

X="\033[0m"

# Colors (R G B)
# BG = transparent/background (dark purple for visibility)
BG="40 30 50"
# Scales
S1="0 120 80"      # Dark green scales
S2="0 160 100"     # Mid green scales
S3="0 200 120"     # Light green scales/highlight
# Underbelly
U1="180 160 100"   # Tan underbelly
U2="200 180 120"   # Light tan
# Eyes
EY="255 200 0"     # Yellow eyes
EP="0 0 0"         # Pupil
# Claws/horns
CL="60 50 40"      # Dark brown claws
CH="80 70 60"      # Horn highlight
# Mouth
MO="150 50 50"     # Red mouth interior

echo "  ┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────────────┐"
echo "  │     FACING DOWN     │ │    FACING LEFT      │ │    FACING RIGHT     │"
echo "  └─────────────────────┘ └─────────────────────┘ └─────────────────────┘"
echo ""

# Each sprite is 10 cells wide x 12 cells tall = 10x24 "pixels"
# Row pairs (each row represents 2 pixel rows via half-blocks)

# --- FACING DOWN ---
# Using ▀ (upper half) and ▄ (lower half) and █ (full) and space (empty)

# Row 1-2: Top of head with small horns
echo -en "  "
echo -en "$(c $BG $BG) $(c $CL $BG)▄$(c $S1 $BG)▄▄▄▄$(c $CL $BG)▄$(c $BG $BG) "
echo -en "   "
echo -en "$(c $BG $BG) $(c $BG $BG) $(c $CL $BG)▄$(c $S1 $BG)▄▄▄▄$(c $BG $BG)  "
echo -en "   "
echo -en "$(c $BG $BG)  $(c $S1 $BG)▄▄▄▄$(c $CL $BG)▄$(c $BG $BG) $(c $BG $BG) "
echo -e "${X}"

# Row 3-4: Upper head with eyes
echo -en "  "
echo -en "$(c $S2 $S1)▄$(c $S1 $S1)█$(c $EY $S1)▀$(c $S2 $S1)▄▄$(c $EY $S1)▀$(c $S1 $S1)█$(c $S2 $S1)▄"
echo -en "   "
echo -en "$(c $BG $BG) $(c $S2 $S1)▄$(c $S1 $S1)█$(c $EY $S1)▀$(c $S2 $S1)▄▄$(c $S1 $S1)█$(c $S2 $S1)▄$(c $BG $BG) "
echo -en "   "
echo -en "$(c $BG $BG) $(c $S2 $S1)▄$(c $S1 $S1)█$(c $S2 $S1)▄▄$(c $EY $S1)▀$(c $S1 $S1)█$(c $S2 $S1)▄$(c $BG $BG) "
echo -e "${X}"

# Row 5-6: Snout/muzzle
echo -en "  "
echo -en "$(c $S1 $S2)▄$(c $S2 $S2)█$(c $S3 $S2)▀$(c $U1 $S2)▄▄$(c $S3 $S2)▀$(c $S2 $S2)█$(c $S1 $S2)▄"
echo -en "   "
echo -en "$(c $BG $BG) $(c $S1 $S2)▄$(c $S2 $S2)██$(c $U1 $S2)▄$(c $S2 $S2)██$(c $S1 $S2)▄$(c $BG $BG) "
echo -en "   "
echo -en "$(c $BG $BG) $(c $S1 $S2)▄$(c $S2 $S2)██$(c $U1 $S2)▄$(c $S2 $S2)██$(c $S1 $S2)▄$(c $BG $BG) "
echo -e "${X}"

# Row 7-8: Neck/shoulders
echo -en "  "
echo -en "$(c $S1 $BG)▀$(c $S2 $S1)▄$(c $U1 $S2)▄$(c $U2 $U1)▀▀$(c $U1 $S2)▄$(c $S2 $S1)▄$(c $S1 $BG)▀"
echo -en "   "
echo -en "$(c $BG $BG) $(c $S1 $BG)▀$(c $S2 $S1)▄$(c $U1 $U1)██$(c $S2 $S1)▄▄$(c $BG $BG) $(c $BG $BG) "
echo -en "   "
echo -en "$(c $BG $BG) $(c $BG $BG) $(c $S2 $S1)▄▄$(c $U1 $U1)██$(c $S2 $S1)▄$(c $S1 $BG)▀$(c $BG $BG) "
echo -e "${X}"

# Row 9-10: Upper torso with arms
echo -en "  "
echo -en "$(c $CL $BG)▄$(c $S1 $S2)▄$(c $S2 $S2)█$(c $U1 $U1)██$(c $S2 $S2)█$(c $S1 $S2)▄$(c $CL $BG)▄"
echo -en "   "
echo -en "$(c $CL $BG)▄$(c $S1 $BG)▀$(c $S2 $S1)▄$(c $U1 $U1)██$(c $S2 $S1)▄$(c $S1 $S2)▄$(c $S2 $BG)▀$(c $BG $BG) "
echo -en "   "
echo -en "$(c $BG $BG) $(c $S2 $BG)▀$(c $S1 $S2)▄$(c $S2 $S1)▄$(c $U1 $U1)██$(c $S2 $S1)▄$(c $S1 $BG)▀$(c $CL $BG)▄"
echo -e "${X}"

# Row 11-12: Lower torso
echo -en "  "
echo -en "$(c $CL $CL)█$(c $S1 $S1)█$(c $S2 $S2)█$(c $U1 $U1)██$(c $S2 $S2)█$(c $S1 $S1)█$(c $CL $CL)█"
echo -en "   "
echo -en "$(c $CL $CL)█$(c $S1 $S1)█$(c $S2 $S2)█$(c $U1 $U1)██$(c $S2 $S2)█$(c $S1 $S1)█$(c $S1 $BG)▀$(c $BG $BG) "
echo -en "   "
echo -en "$(c $BG $BG) $(c $S1 $BG)▀$(c $S1 $S1)█$(c $S2 $S2)█$(c $U1 $U1)██$(c $S2 $S2)█$(c $S1 $S1)█$(c $CL $CL)█"
echo -e "${X}"

# Row 13-14: Hips
echo -en "  "
echo -en "$(c $BG $CL)▀$(c $S1 $S1)█$(c $S2 $S2)█$(c $U1 $U1)██$(c $S2 $S2)█$(c $S1 $S1)█$(c $BG $CL)▀"
echo -en "   "
echo -en "$(c $BG $CL)▀$(c $S1 $S1)█$(c $S2 $S2)█$(c $U1 $U1)██$(c $S2 $S2)█$(c $S1 $S1)█$(c $BG $BG) $(c $BG $BG) "
echo -en "   "
echo -en "$(c $BG $BG) $(c $BG $BG) $(c $S1 $S1)█$(c $S2 $S2)█$(c $U1 $U1)██$(c $S2 $S2)█$(c $S1 $S1)█$(c $BG $CL)▀"
echo -e "${X}"

# Row 15-16: Upper legs
echo -en "  "
echo -en "$(c $BG $BG) $(c $S1 $S1)█$(c $S2 $BG)▀$(c $BG $BG) $(c $BG $BG) $(c $S2 $BG)▀$(c $S1 $S1)█$(c $BG $BG) "
echo -en "   "
echo -en "$(c $BG $BG) $(c $S1 $S1)█$(c $S1 $S1)█$(c $BG $BG) $(c $BG $BG) $(c $S1 $S1)█$(c $S1 $S1)█$(c $S1 $BG)▄$(c $BG $BG) "
echo -en "   "
echo -en "$(c $BG $BG) $(c $S1 $BG)▄$(c $S1 $S1)█$(c $S1 $S1)█$(c $BG $BG) $(c $BG $BG) $(c $S1 $S1)█$(c $S1 $S1)█$(c $BG $BG) "
echo -e "${X}"

# Row 17-18: Lower legs
echo -en "  "
echo -en "$(c $BG $BG) $(c $S1 $S1)█$(c $S1 $S1)█$(c $BG $BG) $(c $BG $BG) $(c $S1 $S1)█$(c $S1 $S1)█$(c $BG $BG) "
echo -en "   "
echo -en "$(c $BG $BG) $(c $S1 $S1)█$(c $S1 $S1)█$(c $BG $BG) $(c $BG $BG) $(c $S1 $S1)█$(c $S1 $BG)▀$(c $S1 $S1)█$(c $BG $BG) "
echo -en "   "
echo -en "$(c $BG $BG) $(c $S1 $S1)█$(c $S1 $BG)▀$(c $S1 $S1)█$(c $BG $BG) $(c $BG $BG) $(c $S1 $S1)█$(c $S1 $S1)█$(c $BG $BG) "
echo -e "${X}"

# Row 19-20: Feet with claws
echo -en "  "
echo -en "$(c $CL $BG)▄$(c $S1 $S1)█$(c $CL $S1)▄$(c $BG $BG) $(c $BG $BG) $(c $CL $S1)▄$(c $S1 $S1)█$(c $CL $BG)▄"
echo -en "   "
echo -en "$(c $CL $BG)▄$(c $S1 $S1)█$(c $CL $S1)▄$(c $BG $BG) $(c $BG $BG) $(c $S1 $BG)▀$(c $CL $S1)▄$(c $S1 $S1)█$(c $CL $BG)▄"
echo -en "   "
echo -en "$(c $CL $BG)▄$(c $S1 $S1)█$(c $CL $S1)▄$(c $S1 $BG)▀$(c $BG $BG) $(c $BG $BG) $(c $CL $S1)▄$(c $S1 $S1)█$(c $CL $BG)▄"
echo -e "${X}"

# Row 21-22: Claws
echo -en "  "
echo -en "$(c $BG $CL)▀$(c $CL $CL)█$(c $BG $CL)▀$(c $BG $BG) $(c $BG $BG) $(c $BG $CL)▀$(c $CL $CL)█$(c $BG $CL)▀"
echo -en "   "
echo -en "$(c $BG $CL)▀$(c $CL $CL)█$(c $BG $CL)▀$(c $BG $BG) $(c $BG $BG) $(c $BG $BG) $(c $BG $CL)▀$(c $CL $CL)█$(c $BG $CL)▀"
echo -en "   "
echo -en "$(c $BG $CL)▀$(c $CL $CL)█$(c $BG $CL)▀$(c $BG $BG) $(c $BG $BG) $(c $BG $BG) $(c $BG $CL)▀$(c $CL $CL)█$(c $BG $CL)▀"
echo -e "${X}"

echo ""
echo "  Resolution: 10×24 pixels per sprite (10 cells × 12 rows, 2 vertical pixels/cell)"
echo "  Characters: ▀ (upper half), ▄ (lower half), █ (full block), space (empty)"
echo "  Colors: Foreground = top pixel, Background = bottom pixel"
echo ""
