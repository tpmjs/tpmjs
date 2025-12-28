#!/bin/bash
# Reptile Lord - Method 2: Quadrant Block Characters
# Each cell = 2×2 subpixels (4 pixels per cell)
#
# Quadrant characters (2-color only: fg + bg):
# ▖ = bottom-left        ▗ = bottom-right
# ▘ = top-left           ▝ = top-right
# ▌ = left half          ▐ = right half
# ▀ = top half           ▄ = bottom half
# ▙ = all except top-right    ▟ = all except top-left
# ▛ = all except bottom-right ▜ = all except bottom-left
# █ = full block         (space) = empty
#
# Limitation: Only 2 colors per cell (foreground + background)

clear
echo ""
echo "  ╔═══════════════════════════════════════════════════════════════════════════╗"
echo "  ║          REPTILE LORD - QUADRANT BLOCKS (2×2 subpixels/cell)              ║"
echo "  ╚═══════════════════════════════════════════════════════════════════════════╝"
echo ""

# Color helper
c() {
    echo -en "\033[38;2;$1;$2;$3m\033[48;2;$4;$5;$6m"
}
X="\033[0m"

# Palette
BG="30 25 40"       # Background
S1="0 100 70"       # Dark scales
S2="0 140 90"       # Mid scales
S3="0 180 110"      # Light scales
U1="170 150 90"     # Underbelly dark
U2="190 170 110"    # Underbelly light
EY="255 200 0"      # Eye
CL="50 40 35"       # Claw
HR="70 60 50"       # Horn

echo "  ┌───────────────────────────────────────────────────────────────────────────┐"
echo "  │  FACING FORWARD (Idle)        ATTACK FRAME              WALKING FRAME    │"
echo "  └───────────────────────────────────────────────────────────────────────────┘"
echo ""

# Sprite: 8 cells wide × 10 cells tall = 16×20 subpixels
# Building row by row (each cell is 2×2)

# --- ROW 1: Horns and top of head ---
echo -en "  "
# IDLE
echo -en "$(c $BG $BG) $(c $HR $BG)▖$(c $S1 $BG)▄▄$(c $HR $BG)▗$(c $BG $BG)  "
echo -en "    "
# ATTACK - horns more prominent
echo -en "$(c $HR $BG)▗$(c $HR $BG)▖$(c $S1 $BG)▄▄$(c $HR $BG)▗$(c $HR $BG)▖$(c $BG $BG) "
echo -en "    "
# WALK
echo -en "$(c $BG $BG) $(c $HR $BG)▖$(c $S1 $BG)▄▄$(c $HR $BG)▗$(c $BG $BG)  "
echo -e "${X}"

# --- ROW 2: Upper head with eyes ---
echo -en "  "
# IDLE
echo -en "$(c $S2 $S1)▙$(c $S1 $S1)█$(c $EY $S1)▐$(c $S1 $S1)█$(c $EY $S1)▌$(c $S1 $S1)█$(c $S2 $S1)▟$(c $BG $BG) "
echo -en "    "
# ATTACK - angry eyes
echo -en "$(c $S2 $S1)▙$(c $S1 $S1)█$(c $EY $S1)▄$(c $S1 $S1)█$(c $EY $S1)▄$(c $S1 $S1)█$(c $S2 $S1)▟$(c $BG $BG) "
echo -en "    "
# WALK
echo -en "$(c $S2 $S1)▙$(c $S1 $S1)█$(c $EY $S1)▐$(c $S1 $S1)█$(c $EY $S1)▌$(c $S1 $S1)█$(c $S2 $S1)▟$(c $BG $BG) "
echo -e "${X}"

# --- ROW 3: Snout/muzzle ---
echo -en "  "
# IDLE
echo -en "$(c $S1 $S2)▜$(c $S2 $S2)█$(c $U1 $S2)▄▄$(c $S2 $S2)█$(c $S1 $S2)▛$(c $BG $BG)  "
echo -en "    "
# ATTACK - open mouth
echo -en "$(c $S1 $S2)▜$(c $S2 $S2)█$(c $U1 $S2)▀▀$(c $S2 $S2)█$(c $S1 $S2)▛$(c $BG $BG)  "
echo -en "    "
# WALK
echo -en "$(c $S1 $S2)▜$(c $S2 $S2)█$(c $U1 $S2)▄▄$(c $S2 $S2)█$(c $S1 $S2)▛$(c $BG $BG)  "
echo -e "${X}"

# --- ROW 4: Neck ---
echo -en "  "
# IDLE
echo -en "$(c $BG $BG) $(c $S1 $S2)▜$(c $U1 $U1)██$(c $S1 $S2)▛$(c $BG $BG)   "
echo -en "    "
# ATTACK
echo -en "$(c $BG $BG) $(c $S1 $S2)▜$(c $U1 $U1)██$(c $S1 $S2)▛$(c $BG $BG)   "
echo -en "    "
# WALK
echo -en "$(c $BG $BG) $(c $S1 $S2)▜$(c $U1 $U1)██$(c $S1 $S2)▛$(c $BG $BG)   "
echo -e "${X}"

# --- ROW 5: Shoulders/arms ---
echo -en "  "
# IDLE - arms down
echo -en "$(c $CL $BG)▗$(c $S1 $S1)█$(c $S2 $S2)█$(c $U1 $U1)█$(c $S2 $S2)█$(c $S1 $S1)█$(c $CL $BG)▖$(c $BG $BG) "
echo -en "    "
# ATTACK - arms raised
echo -en "$(c $CL $S1)▗$(c $S1 $BG)▘$(c $S2 $S2)█$(c $U1 $U1)█$(c $S2 $S2)█$(c $S1 $BG)▝$(c $CL $S1)▖$(c $BG $BG) "
echo -en "    "
# WALK - one arm forward
echo -en "$(c $S1 $BG)▗$(c $S1 $S1)█$(c $S2 $S2)█$(c $U1 $U1)█$(c $S2 $S2)█$(c $S1 $S1)█$(c $CL $BG)▖$(c $BG $BG) "
echo -e "${X}"

# --- ROW 6: Torso ---
echo -en "  "
# IDLE
echo -en "$(c $CL $CL)█$(c $S1 $S1)█$(c $S2 $S2)█$(c $U1 $U1)█$(c $S2 $S2)█$(c $S1 $S1)█$(c $CL $CL)█$(c $BG $BG) "
echo -en "    "
# ATTACK
echo -en "$(c $CL $CL)█$(c $S1 $S1)█$(c $S2 $S2)█$(c $U1 $U1)█$(c $S2 $S2)█$(c $S1 $S1)█$(c $CL $CL)█$(c $BG $BG) "
echo -en "    "
# WALK
echo -en "$(c $CL $BG)▝$(c $S1 $S1)█$(c $S2 $S2)█$(c $U1 $U1)█$(c $S2 $S2)█$(c $S1 $S1)█$(c $CL $CL)█$(c $BG $BG) "
echo -e "${X}"

# --- ROW 7: Lower torso/hips ---
echo -en "  "
# IDLE
echo -en "$(c $BG $CL)▀$(c $S1 $S1)█$(c $S2 $S2)█$(c $U1 $U1)█$(c $S2 $S2)█$(c $S1 $S1)█$(c $BG $CL)▀$(c $BG $BG) "
echo -en "    "
# ATTACK
echo -en "$(c $BG $CL)▀$(c $S1 $S1)█$(c $S2 $S2)█$(c $U1 $U1)█$(c $S2 $S2)█$(c $S1 $S1)█$(c $BG $CL)▀$(c $BG $BG) "
echo -en "    "
# WALK
echo -en "$(c $BG $BG) $(c $S1 $S1)█$(c $S2 $S2)█$(c $U1 $U1)█$(c $S2 $S2)█$(c $S1 $S1)█$(c $BG $CL)▀$(c $BG $BG) "
echo -e "${X}"

# --- ROW 8: Upper legs ---
echo -en "  "
# IDLE
echo -en "$(c $BG $BG) $(c $S1 $S1)█$(c $S1 $BG)▘$(c $BG $BG) $(c $S1 $BG)▝$(c $S1 $S1)█$(c $BG $BG)  "
echo -en "    "
# ATTACK - wide stance
echo -en "$(c $S1 $BG)▗$(c $S1 $S1)█$(c $BG $BG)  $(c $S1 $S1)█$(c $S1 $BG)▖$(c $BG $BG)  "
echo -en "    "
# WALK - mid stride
echo -en "$(c $BG $BG) $(c $S1 $S1)█$(c $S1 $BG)▝$(c $BG $BG) $(c $S1 $BG)▘$(c $S1 $S1)█$(c $BG $BG)  "
echo -e "${X}"

# --- ROW 9: Lower legs ---
echo -en "  "
# IDLE
echo -en "$(c $BG $BG) $(c $S1 $S1)█$(c $S1 $S1)█$(c $BG $BG) $(c $S1 $S1)█$(c $S1 $S1)█$(c $BG $BG)  "
echo -en "    "
# ATTACK
echo -en "$(c $S1 $S1)█$(c $S1 $S1)█$(c $BG $BG)  $(c $S1 $S1)█$(c $S1 $S1)█$(c $BG $BG)  "
echo -en "    "
# WALK
echo -en "$(c $BG $BG) $(c $S1 $S1)█$(c $S1 $BG)▘$(c $BG $BG) $(c $BG $BG) $(c $S1 $BG)▝$(c $S1 $S1)█$(c $BG $BG) "
echo -e "${X}"

# --- ROW 10: Feet with claws ---
echo -en "  "
# IDLE
echo -en "$(c $CL $BG)▖$(c $S1 $S1)█$(c $CL $BG)▗$(c $BG $BG) $(c $CL $BG)▖$(c $S1 $S1)█$(c $CL $BG)▗$(c $BG $BG) "
echo -en "    "
# ATTACK
echo -en "$(c $CL $S1)▙$(c $S1 $S1)█$(c $CL $BG)▗$(c $BG $BG) $(c $CL $BG)▖$(c $S1 $S1)█$(c $CL $S1)▟$(c $BG $BG) "
echo -en "    "
# WALK
echo -en "$(c $CL $BG)▖$(c $S1 $S1)█$(c $CL $BG)▗$(c $BG $BG) $(c $BG $BG) $(c $CL $BG)▖$(c $S1 $S1)█$(c $CL $BG)▗"
echo -e "${X}"

echo ""
echo "  ┌───────────────────────────────────────────────────────────────────────────┐"
echo "  │  QUADRANT BLOCK REFERENCE                                                 │"
echo "  ├───────────────────────────────────────────────────────────────────────────┤"
echo "  │  ▘ top-left    ▝ top-right    ▖ bottom-left   ▗ bottom-right             │"
echo "  │  ▌ left-half   ▐ right-half   ▀ top-half      ▄ bottom-half              │"
echo "  │  ▛ no-BR       ▜ no-BL        ▙ no-TR         ▟ no-TL                    │"
echo "  │  █ full        (space) empty                                              │"
echo "  └───────────────────────────────────────────────────────────────────────────┘"
echo ""
echo "  Resolution: 16×20 subpixels per sprite (8 cells × 10 rows, 2×2 per cell)"
echo "  Limitation: Only 2 colors per cell (foreground + background)"
echo ""
