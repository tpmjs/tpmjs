#!/bin/bash

# Humanoid Beast Sprite Sheet with Bounding Boxes
# Colors (background mode for solid pixels)
F="\033[48;2;139;90;43m"      # Fur (brown)
D="\033[48;2;101;67;33m"      # Dark fur
L="\033[48;2;178;134;87m"     # Light fur/highlight
E="\033[48;2;255;200;0m"      # Eyes (glowing yellow)
e="\033[48;2;180;140;0m"      # Eyes dark
M="\033[48;2;60;40;30m"       # Muzzle/nose dark
T="\033[48;2;200;200;200m"    # Teeth/claws
C="\033[48;2;40;40;40m"       # Claws dark
X="\033[0m"                   # Reset
P="  "                        # Pixel (two spaces)

# Box drawing
BOX_COLOR="\033[38;2;100;100;100m"
RESET="\033[0m"

clear
echo ""
echo -e "\033[1m  HUMANOID BEAST - SPRITE SHEET\033[0m"
echo -e "  Each sprite: 16x20 pixels (32x20 characters)"
echo ""

# Function to draw horizontal box line
hline() {
    echo -ne "${BOX_COLOR}"
    echo -n "  ┌"
    for i in {1..32}; do echo -n "─"; done
    echo -n "┐    ┌"
    for i in {1..32}; do echo -n "─"; done
    echo -n "┐    ┌"
    for i in {1..32}; do echo -n "─"; done
    echo -n "┐    ┌"
    for i in {1..32}; do echo -n "─"; done
    echo -e "┐${RESET}"
}

hline_bottom() {
    echo -ne "${BOX_COLOR}"
    echo -n "  └"
    for i in {1..32}; do echo -n "─"; done
    echo -n "┘    └"
    for i in {1..32}; do echo -n "─"; done
    echo -n "┘    └"
    for i in {1..32}; do echo -n "─"; done
    echo -n "┘    └"
    for i in {1..32}; do echo -n "─"; done
    echo -e "┘${RESET}"
}

V="${BOX_COLOR}│${RESET}"

echo -e "\033[1m  WALKING DOWN\033[0m"
echo "     Frame 1                    Frame 2                    Frame 3                    Frame 4"
hline
# Row 1 - Ears
printf "  ${V}        ${D}${P}${P}${X}        ${D}${P}${P}${X}        ${V}    ${V}        ${D}${P}${P}${X}        ${D}${P}${P}${X}        ${V}    ${V}        ${D}${P}${P}${X}        ${D}${P}${P}${X}        ${V}    ${V}        ${D}${P}${P}${X}        ${D}${P}${P}${X}        ${V}\n"
# Row 2 - Ears connect to head
printf "  ${V}      ${D}${P}${F}${P}${P}${X}        ${F}${P}${D}${P}${X}      ${V}    ${V}      ${D}${P}${F}${P}${P}${X}        ${F}${P}${D}${P}${X}      ${V}    ${V}      ${D}${P}${F}${P}${P}${X}        ${F}${P}${D}${P}${X}      ${V}    ${V}      ${D}${P}${F}${P}${P}${X}        ${F}${P}${D}${P}${X}      ${V}\n"
# Row 3 - Top of head
printf "  ${V}      ${D}${P}${F}${P}${P}${P}${P}${P}${P}${P}${P}${F}${P}${D}${P}${X}      ${V}    ${V}      ${D}${P}${F}${P}${P}${P}${P}${P}${P}${P}${P}${F}${P}${D}${P}${X}      ${V}    ${V}      ${D}${P}${F}${P}${P}${P}${P}${P}${P}${P}${P}${F}${P}${D}${P}${X}      ${V}    ${V}      ${D}${P}${F}${P}${P}${P}${P}${P}${P}${P}${P}${F}${P}${D}${P}${X}      ${V}\n"
# Row 4 - Brow
printf "  ${V}      ${F}${P}${L}${P}${F}${P}${P}${P}${P}${P}${P}${L}${P}${F}${P}${X}      ${V}    ${V}      ${F}${P}${L}${P}${F}${P}${P}${P}${P}${P}${P}${L}${P}${F}${P}${X}      ${V}    ${V}      ${F}${P}${L}${P}${F}${P}${P}${P}${P}${P}${P}${L}${P}${F}${P}${X}      ${V}    ${V}      ${F}${P}${L}${P}${F}${P}${P}${P}${P}${P}${P}${L}${P}${F}${P}${X}      ${V}\n"
# Row 5 - Eyes
printf "  ${V}      ${F}${P}${E}${P}${P}${F}${P}${P}${P}${P}${E}${P}${P}${F}${P}${X}      ${V}    ${V}      ${F}${P}${E}${P}${P}${F}${P}${P}${P}${P}${E}${P}${P}${F}${P}${X}      ${V}    ${V}      ${F}${P}${E}${P}${P}${F}${P}${P}${P}${P}${E}${P}${P}${F}${P}${X}      ${V}    ${V}      ${F}${P}${E}${P}${P}${F}${P}${P}${P}${P}${E}${P}${P}${F}${P}${X}      ${V}\n"
# Row 6 - Under eyes
printf "  ${V}      ${F}${P}${e}${P}${F}${P}${P}${P}${P}${P}${P}${e}${P}${F}${P}${X}      ${V}    ${V}      ${F}${P}${e}${P}${F}${P}${P}${P}${P}${P}${P}${e}${P}${F}${P}${X}      ${V}    ${V}      ${F}${P}${e}${P}${F}${P}${P}${P}${P}${P}${P}${e}${P}${F}${P}${X}      ${V}    ${V}      ${F}${P}${e}${P}${F}${P}${P}${P}${P}${P}${P}${e}${P}${F}${P}${X}      ${V}\n"
# Row 7 - Muzzle top
printf "  ${V}        ${F}${P}${P}${D}${P}${M}${P}${P}${D}${P}${F}${P}${P}${X}        ${V}    ${V}        ${F}${P}${P}${D}${P}${M}${P}${P}${D}${P}${F}${P}${P}${X}        ${V}    ${V}        ${F}${P}${P}${D}${P}${M}${P}${P}${D}${P}${F}${P}${P}${X}        ${V}    ${V}        ${F}${P}${P}${D}${P}${M}${P}${P}${D}${P}${F}${P}${P}${X}        ${V}\n"
# Row 8 - Mouth with fangs
printf "  ${V}        ${F}${P}${T}${P}${M}${P}${P}${P}${P}${T}${P}${F}${P}${X}        ${V}    ${V}        ${F}${P}${T}${P}${M}${P}${P}${P}${P}${T}${P}${F}${P}${X}        ${V}    ${V}        ${F}${P}${T}${P}${M}${P}${P}${P}${P}${T}${P}${F}${P}${X}        ${V}    ${V}        ${F}${P}${T}${P}${M}${P}${P}${P}${P}${T}${P}${F}${P}${X}        ${V}\n"
# Row 9 - Chin
printf "  ${V}          ${D}${P}${F}${P}${P}${P}${P}${F}${P}${D}${P}${X}          ${V}    ${V}          ${D}${P}${F}${P}${P}${P}${P}${F}${P}${D}${P}${X}          ${V}    ${V}          ${D}${P}${F}${P}${P}${P}${P}${F}${P}${D}${P}${X}          ${V}    ${V}          ${D}${P}${F}${P}${P}${P}${P}${F}${P}${D}${P}${X}          ${V}\n"
# Row 10 - Neck
printf "  ${V}            ${D}${P}${F}${P}${P}${F}${P}${D}${P}${X}            ${V}    ${V}            ${D}${P}${F}${P}${P}${F}${P}${D}${P}${X}            ${V}    ${V}            ${D}${P}${F}${P}${P}${F}${P}${D}${P}${X}            ${V}    ${V}            ${D}${P}${F}${P}${P}${F}${P}${D}${P}${X}            ${V}\n"
# Row 11 - Shoulders
printf "  ${V}    ${D}${P}${F}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${F}${P}${D}${P}${X}    ${V}    ${V}    ${D}${P}${F}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${F}${P}${D}${P}${X}    ${V}    ${V}    ${D}${P}${F}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${F}${P}${D}${P}${X}    ${V}    ${V}    ${D}${P}${F}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${F}${P}${D}${P}${X}    ${V}\n"
# Row 12 - Upper torso
printf "  ${V}  ${C}${P}${F}${P}${P}${P}${D}${P}${F}${P}${P}${P}${P}${D}${P}${F}${P}${P}${P}${C}${P}${X}  ${V}    ${V}  ${C}${P}${F}${P}${P}${P}${D}${P}${F}${P}${P}${P}${P}${D}${P}${F}${P}${P}${P}${C}${P}${X}  ${V}    ${V}  ${C}${P}${F}${P}${P}${P}${D}${P}${F}${P}${P}${P}${P}${D}${P}${F}${P}${P}${P}${C}${P}${X}  ${V}    ${V}  ${C}${P}${F}${P}${P}${P}${D}${P}${F}${P}${P}${P}${P}${D}${P}${F}${P}${P}${P}${C}${P}${X}  ${V}\n"
# Row 13 - Mid torso with claws
printf "  ${V}  ${T}${P}${D}${P}${F}${P}${P}${D}${P}${F}${P}${P}${D}${P}${F}${P}${P}${D}${P}${T}${P}${X}  ${V}    ${V}  ${T}${P}${D}${P}${F}${P}${P}${D}${P}${F}${P}${P}${D}${P}${F}${P}${P}${D}${P}${T}${P}${X}  ${V}    ${V}  ${T}${P}${D}${P}${F}${P}${P}${D}${P}${F}${P}${P}${D}${P}${F}${P}${P}${D}${P}${T}${P}${X}  ${V}    ${V}  ${T}${P}${D}${P}${F}${P}${P}${D}${P}${F}${P}${P}${D}${P}${F}${P}${P}${D}${P}${T}${P}${X}  ${V}\n"
# Row 14 - Lower torso
printf "  ${V}      ${D}${P}${F}${P}${P}${P}${P}${P}${P}${P}${P}${F}${P}${D}${P}${X}      ${V}    ${V}      ${D}${P}${F}${P}${P}${P}${P}${P}${P}${P}${P}${F}${P}${D}${P}${X}      ${V}    ${V}      ${D}${P}${F}${P}${P}${P}${P}${P}${P}${P}${P}${F}${P}${D}${P}${X}      ${V}    ${V}      ${D}${P}${F}${P}${P}${P}${P}${P}${P}${P}${P}${F}${P}${D}${P}${X}      ${V}\n"
# Row 15 - Hips
printf "  ${V}        ${D}${P}${F}${P}${P}${P}${P}${P}${P}${F}${P}${D}${P}${X}        ${V}    ${V}        ${D}${P}${F}${P}${P}${P}${P}${P}${P}${F}${P}${D}${P}${X}        ${V}    ${V}        ${D}${P}${F}${P}${P}${P}${P}${P}${P}${F}${P}${D}${P}${X}        ${V}    ${V}        ${D}${P}${F}${P}${P}${P}${P}${P}${P}${F}${P}${D}${P}${X}        ${V}\n"
# Row 16 - Upper legs - animated
printf "  ${V}        ${F}${P}${P}${P}${X}    ${F}${P}${P}${P}${X}        ${V}    ${V}        ${F}${P}${P}${P}${F}${P}${P}${P}${X}            ${V}    ${V}        ${F}${P}${P}${P}${X}    ${F}${P}${P}${P}${X}        ${V}    ${V}            ${F}${P}${P}${P}${F}${P}${P}${P}${X}        ${V}\n"
# Row 17 - Mid legs
printf "  ${V}        ${D}${P}${F}${P}${X}    ${F}${P}${D}${P}${X}        ${V}    ${V}        ${D}${P}${F}${P}${F}${P}${D}${P}${X}            ${V}    ${V}        ${D}${P}${F}${P}${X}    ${F}${P}${D}${P}${X}        ${V}    ${V}            ${D}${P}${F}${P}${F}${P}${D}${P}${X}        ${V}\n"
# Row 18 - Lower legs
printf "  ${V}        ${D}${P}${F}${P}${X}    ${F}${P}${D}${P}${X}        ${V}    ${V}      ${D}${P}${F}${P}${X}    ${F}${P}${D}${P}${X}          ${V}    ${V}        ${D}${P}${F}${P}${X}    ${F}${P}${D}${P}${X}        ${V}    ${V}          ${D}${P}${F}${P}${X}    ${F}${P}${D}${P}${X}      ${V}\n"
# Row 19 - Feet with claws
printf "  ${V}      ${C}${P}${D}${P}${F}${P}${X}    ${F}${P}${D}${P}${C}${P}${X}      ${V}    ${V}    ${C}${P}${D}${P}${F}${P}${X}    ${F}${P}${D}${P}${C}${P}${X}        ${V}    ${V}      ${C}${P}${D}${P}${F}${P}${X}    ${F}${P}${D}${P}${C}${P}${X}      ${V}    ${V}        ${C}${P}${D}${P}${F}${P}${X}    ${F}${P}${D}${P}${C}${P}${X}    ${V}\n"
# Row 20 - Claws
printf "  ${V}      ${T}${P}${C}${P}${X}        ${C}${P}${T}${P}${X}      ${V}    ${V}    ${T}${P}${C}${P}${X}        ${C}${P}${T}${P}${X}        ${V}    ${V}      ${T}${P}${C}${P}${X}        ${C}${P}${T}${P}${X}      ${V}    ${V}        ${T}${P}${C}${P}${X}        ${C}${P}${T}${P}${X}    ${V}\n"
hline_bottom
echo ""

echo -e "\033[1m  WALKING LEFT (SIDE VIEW)\033[0m"
echo "     Frame 1                    Frame 2                    Frame 3                    Frame 4"
hline
# Row 1 - Ear
printf "  ${V}          ${D}${P}${P}${X}                  ${V}    ${V}          ${D}${P}${P}${X}                  ${V}    ${V}          ${D}${P}${P}${X}                  ${V}    ${V}          ${D}${P}${P}${X}                  ${V}\n"
# Row 2 - Ear to head
printf "  ${V}        ${D}${P}${F}${P}${P}${X}                  ${V}    ${V}        ${D}${P}${F}${P}${P}${X}                  ${V}    ${V}        ${D}${P}${F}${P}${P}${X}                  ${V}    ${V}        ${D}${P}${F}${P}${P}${X}                  ${V}\n"
# Row 3 - Head top
printf "  ${V}        ${D}${P}${F}${P}${P}${P}${P}${P}${D}${P}${X}            ${V}    ${V}        ${D}${P}${F}${P}${P}${P}${P}${P}${D}${P}${X}            ${V}    ${V}        ${D}${P}${F}${P}${P}${P}${P}${P}${D}${P}${X}            ${V}    ${V}        ${D}${P}${F}${P}${P}${P}${P}${P}${D}${P}${X}            ${V}\n"
# Row 4 - Brow
printf "  ${V}        ${F}${P}${L}${P}${F}${P}${P}${P}${P}${F}${P}${X}          ${V}    ${V}        ${F}${P}${L}${P}${F}${P}${P}${P}${P}${F}${P}${X}          ${V}    ${V}        ${F}${P}${L}${P}${F}${P}${P}${P}${P}${F}${P}${X}          ${V}    ${V}        ${F}${P}${L}${P}${F}${P}${P}${P}${P}${F}${P}${X}          ${V}\n"
# Row 5 - Eye (side)
printf "  ${V}        ${E}${P}${P}${F}${P}${P}${P}${P}${P}${F}${P}${X}          ${V}    ${V}        ${E}${P}${P}${F}${P}${P}${P}${P}${P}${F}${P}${X}          ${V}    ${V}        ${E}${P}${P}${F}${P}${P}${P}${P}${P}${F}${P}${X}          ${V}    ${V}        ${E}${P}${P}${F}${P}${P}${P}${P}${P}${F}${P}${X}          ${V}\n"
# Row 6 - Muzzle
printf "  ${V}      ${D}${P}${M}${P}${P}${F}${P}${P}${P}${P}${D}${P}${X}          ${V}    ${V}      ${D}${P}${M}${P}${P}${F}${P}${P}${P}${P}${D}${P}${X}          ${V}    ${V}      ${D}${P}${M}${P}${P}${F}${P}${P}${P}${P}${D}${P}${X}          ${V}    ${V}      ${D}${P}${M}${P}${P}${F}${P}${P}${P}${P}${D}${P}${X}          ${V}\n"
# Row 7 - Mouth
printf "  ${V}      ${T}${P}${M}${P}${P}${F}${P}${P}${D}${P}${X}            ${V}    ${V}      ${T}${P}${M}${P}${P}${F}${P}${P}${D}${P}${X}            ${V}    ${V}      ${T}${P}${M}${P}${P}${F}${P}${P}${D}${P}${X}            ${V}    ${V}      ${T}${P}${M}${P}${P}${F}${P}${P}${D}${P}${X}            ${V}\n"
# Row 8 - Chin/neck
printf "  ${V}          ${D}${P}${F}${P}${P}${D}${P}${X}            ${V}    ${V}          ${D}${P}${F}${P}${P}${D}${P}${X}            ${V}    ${V}          ${D}${P}${F}${P}${P}${D}${P}${X}            ${V}    ${V}          ${D}${P}${F}${P}${P}${D}${P}${X}            ${V}\n"
# Row 9 - Shoulders
printf "  ${V}      ${C}${P}${D}${P}${F}${P}${P}${P}${P}${P}${P}${D}${P}${X}        ${V}    ${V}      ${C}${P}${D}${P}${F}${P}${P}${P}${P}${P}${P}${D}${P}${X}        ${V}    ${V}      ${C}${P}${D}${P}${F}${P}${P}${P}${P}${P}${P}${D}${P}${X}        ${V}    ${V}      ${C}${P}${D}${P}${F}${P}${P}${P}${P}${P}${P}${D}${P}${X}        ${V}\n"
# Row 10 - Arm/torso
printf "  ${V}      ${T}${P}${F}${P}${P}${D}${P}${F}${P}${P}${P}${P}${D}${P}${X}        ${V}    ${V}      ${T}${P}${F}${P}${P}${D}${P}${F}${P}${P}${P}${P}${D}${P}${X}        ${V}    ${V}      ${T}${P}${F}${P}${P}${D}${P}${F}${P}${P}${P}${P}${D}${P}${X}        ${V}    ${V}      ${T}${P}${F}${P}${P}${D}${P}${F}${P}${P}${P}${P}${D}${P}${X}        ${V}\n"
# Row 11 - Mid torso
printf "  ${V}          ${D}${P}${F}${P}${P}${P}${P}${P}${P}${D}${P}${X}        ${V}    ${V}          ${D}${P}${F}${P}${P}${P}${P}${P}${P}${D}${P}${X}        ${V}    ${V}          ${D}${P}${F}${P}${P}${P}${P}${P}${P}${D}${P}${X}        ${V}    ${V}          ${D}${P}${F}${P}${P}${P}${P}${P}${P}${D}${P}${X}        ${V}\n"
# Row 12 - Lower torso
printf "  ${V}          ${D}${P}${F}${P}${P}${P}${P}${P}${P}${D}${P}${X}        ${V}    ${V}          ${D}${P}${F}${P}${P}${P}${P}${P}${P}${D}${P}${X}        ${V}    ${V}          ${D}${P}${F}${P}${P}${P}${P}${P}${P}${D}${P}${X}        ${V}    ${V}          ${D}${P}${F}${P}${P}${P}${P}${P}${P}${D}${P}${X}        ${V}\n"
# Row 13 - Hips
printf "  ${V}            ${D}${P}${F}${P}${P}${P}${P}${D}${P}${X}        ${V}    ${V}            ${D}${P}${F}${P}${P}${P}${P}${D}${P}${X}        ${V}    ${V}            ${D}${P}${F}${P}${P}${P}${P}${D}${P}${X}        ${V}    ${V}            ${D}${P}${F}${P}${P}${P}${P}${D}${P}${X}        ${V}\n"
# Row 14-20 - Legs animated
printf "  ${V}            ${F}${P}${P}${P}${P}${X}            ${V}    ${V}          ${F}${P}${P}${X}  ${F}${P}${P}${X}          ${V}    ${V}            ${F}${P}${P}${P}${P}${X}            ${V}    ${V}          ${F}${P}${P}${X}  ${F}${P}${P}${X}          ${V}\n"
printf "  ${V}            ${D}${P}${F}${P}${F}${P}${D}${P}${X}            ${V}    ${V}          ${D}${P}${F}${P}${X}  ${F}${P}${D}${P}${X}          ${V}    ${V}            ${D}${P}${F}${P}${F}${P}${D}${P}${X}            ${V}    ${V}          ${D}${P}${F}${P}${X}  ${F}${P}${D}${P}${X}          ${V}\n"
printf "  ${V}            ${D}${P}${F}${P}${F}${P}${D}${P}${X}            ${V}    ${V}        ${D}${P}${F}${P}${X}      ${F}${P}${D}${P}${X}        ${V}    ${V}            ${D}${P}${F}${P}${F}${P}${D}${P}${X}            ${V}    ${V}        ${D}${P}${F}${P}${X}      ${F}${P}${D}${P}${X}        ${V}\n"
printf "  ${V}          ${C}${P}${D}${P}${F}${P}${F}${P}${D}${P}${C}${P}${X}          ${V}    ${V}      ${C}${P}${D}${P}${F}${P}${X}      ${F}${P}${D}${P}${C}${P}${X}      ${V}    ${V}          ${C}${P}${D}${P}${F}${P}${F}${P}${D}${P}${C}${P}${X}          ${V}    ${V}      ${C}${P}${D}${P}${F}${P}${X}      ${F}${P}${D}${P}${C}${P}${X}      ${V}\n"
printf "  ${V}          ${T}${P}${C}${P}${X}  ${C}${P}${T}${P}${X}          ${V}    ${V}      ${T}${P}${C}${P}${X}          ${C}${P}${T}${P}${X}      ${V}    ${V}          ${T}${P}${C}${P}${X}  ${C}${P}${T}${P}${X}          ${V}    ${V}      ${T}${P}${C}${P}${X}          ${C}${P}${T}${P}${X}      ${V}\n"
printf "  ${V}                                ${V}    ${V}                                ${V}    ${V}                                ${V}    ${V}                                ${V}\n"
hline_bottom

echo ""
echo -e "  \033[1mDimensions:\033[0m"
echo "  • Sprite size: 16 pixels wide × 20 pixels tall"
echo "  • Character size: 32 chars wide × 20 rows (each pixel = 2 chars)"
echo "  • Color palette: Brown fur, yellow eyes, white fangs/claws"
echo ""
