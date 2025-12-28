#!/bin/bash

# Dark Android Sprite - Polished version with better proportions
# Colors (background mode for solid pixels)
B="\033[48;2;70;70;80m"      # Body
D="\033[48;2;45;45;55m"      # Dark/Shadow
H="\033[48;2;95;95;105m"     # Highlight
R="\033[48;2;255;50;50m"     # Red glow
r="\033[48;2;180;30;30m"     # Dark red
X="\033[0m"                   # Reset
P="  "                        # Pixel (two spaces)

clear
echo ""
echo -e "\033[1m                              WALKING DOWN\033[0m"
echo ""
echo "       Frame 1              Frame 2              Frame 3              Frame 4"
echo ""

# HEAD - all frames same
printf "         ${D}${P}${B}${P}${P}${P}${D}${P}${X}               ${D}${P}${B}${P}${P}${P}${D}${P}${X}               ${D}${P}${B}${P}${P}${P}${D}${P}${X}               ${D}${P}${B}${P}${P}${P}${D}${P}${X}\n"
printf "       ${D}${P}${B}${P}${P}${P}${P}${P}${D}${P}${X}           ${D}${P}${B}${P}${P}${P}${P}${P}${D}${P}${X}           ${D}${P}${B}${P}${P}${P}${P}${P}${D}${P}${X}           ${D}${P}${B}${P}${P}${P}${P}${P}${D}${P}${X}\n"
printf "       ${B}${P}${H}${P}${B}${P}${P}${P}${H}${P}${B}${P}${X}           ${B}${P}${H}${P}${B}${P}${P}${P}${H}${P}${B}${P}${X}           ${B}${P}${H}${P}${B}${P}${P}${P}${H}${P}${B}${P}${X}           ${B}${P}${H}${P}${B}${P}${P}${P}${H}${P}${B}${P}${X}\n"
printf "       ${B}${P}${R}${P}${P}${B}${P}${P}${P}${R}${P}${P}${B}${P}${X}           ${B}${P}${R}${P}${P}${B}${P}${P}${P}${R}${P}${P}${B}${P}${X}           ${B}${P}${R}${P}${P}${B}${P}${P}${P}${R}${P}${P}${B}${P}${X}           ${B}${P}${R}${P}${P}${B}${P}${P}${P}${R}${P}${P}${B}${P}${X}\n"
printf "       ${B}${P}${r}${P}${P}${B}${P}${P}${P}${r}${P}${P}${B}${P}${X}           ${B}${P}${r}${P}${P}${B}${P}${P}${P}${r}${P}${P}${B}${P}${X}           ${B}${P}${r}${P}${P}${B}${P}${P}${P}${r}${P}${P}${B}${P}${X}           ${B}${P}${r}${P}${P}${B}${P}${P}${P}${r}${P}${P}${B}${P}${X}\n"
printf "       ${B}${P}${P}${P}${P}${P}${P}${P}${P}${P}${B}${P}${X}           ${B}${P}${P}${P}${P}${P}${P}${P}${P}${P}${B}${P}${X}           ${B}${P}${P}${P}${P}${P}${P}${P}${P}${P}${B}${P}${X}           ${B}${P}${P}${P}${P}${P}${P}${P}${P}${P}${B}${P}${X}\n"
printf "         ${D}${P}${B}${P}${P}${P}${P}${P}${D}${P}${X}               ${D}${P}${B}${P}${P}${P}${P}${P}${D}${P}${X}               ${D}${P}${B}${P}${P}${P}${P}${P}${D}${P}${X}               ${D}${P}${B}${P}${P}${P}${P}${P}${D}${P}${X}\n"
# NECK with red accent
printf "           ${R}${P}${D}${P}${P}${P}${R}${P}${X}                   ${R}${P}${D}${P}${P}${P}${R}${P}${X}                   ${R}${P}${D}${P}${P}${P}${R}${P}${X}                   ${R}${P}${D}${P}${P}${P}${R}${P}${X}\n"
# TORSO
printf "       ${B}${P}${P}${R}${P}${B}${P}${P}${P}${P}${R}${P}${B}${P}${P}${X}           ${B}${P}${P}${R}${P}${B}${P}${P}${P}${P}${R}${P}${B}${P}${P}${X}           ${B}${P}${P}${R}${P}${B}${P}${P}${P}${P}${R}${P}${B}${P}${P}${X}           ${B}${P}${P}${R}${P}${B}${P}${P}${P}${P}${R}${P}${B}${P}${P}${X}\n"
printf "       ${B}${P}${D}${P}${R}${P}${B}${P}${P}${R}${P}${D}${P}${B}${P}${X}           ${B}${P}${D}${P}${R}${P}${B}${P}${P}${R}${P}${D}${P}${B}${P}${X}           ${B}${P}${D}${P}${R}${P}${B}${P}${P}${R}${P}${D}${P}${B}${P}${X}           ${B}${P}${D}${P}${R}${P}${B}${P}${P}${R}${P}${D}${P}${B}${P}${X}\n"
printf "       ${B}${P}${D}${P}${R}${P}${B}${P}${P}${R}${P}${D}${P}${B}${P}${X}           ${B}${P}${D}${P}${R}${P}${B}${P}${P}${R}${P}${D}${P}${B}${P}${X}           ${B}${P}${D}${P}${R}${P}${B}${P}${P}${R}${P}${D}${P}${B}${P}${X}           ${B}${P}${D}${P}${R}${P}${B}${P}${P}${R}${P}${D}${P}${B}${P}${X}\n"
printf "         ${B}${P}${R}${P}${B}${P}${P}${R}${P}${B}${P}${X}               ${B}${P}${R}${P}${B}${P}${P}${R}${P}${B}${P}${X}               ${B}${P}${R}${P}${B}${P}${P}${R}${P}${B}${P}${X}               ${B}${P}${R}${P}${B}${P}${P}${R}${P}${B}${P}${X}\n"
printf "         ${D}${P}${R}${P}${B}${P}${P}${R}${P}${D}${P}${X}               ${D}${P}${R}${P}${B}${P}${P}${R}${P}${D}${P}${X}               ${D}${P}${R}${P}${B}${P}${P}${R}${P}${D}${P}${X}               ${D}${P}${R}${P}${B}${P}${P}${R}${P}${D}${P}${X}\n"
printf "           ${B}${P}${D}${P}${P}${P}${B}${P}${X}                   ${B}${P}${D}${P}${P}${P}${B}${P}${X}                   ${B}${P}${D}${P}${P}${P}${B}${P}${X}                   ${B}${P}${D}${P}${P}${P}${B}${P}${X}\n"
# LEGS - Frame 1: standing, Frame 2: step left, Frame 3: standing, Frame 4: step right
printf "         ${B}${P}${P}${X}    ${B}${P}${P}${X}             ${B}${P}${P}${X}${B}${P}${P}${X}                   ${B}${P}${P}${X}    ${B}${P}${P}${X}               ${B}${P}${P}${B}${P}${P}${X}\n"
printf "         ${B}${P}${R}${P}${X}    ${R}${P}${B}${P}${X}           ${B}${P}${R}${P}${R}${P}${B}${P}${X}                 ${B}${P}${R}${P}${X}    ${R}${P}${B}${P}${X}             ${B}${P}${R}${P}${R}${P}${B}${P}${X}\n"
printf "         ${B}${P}${P}${X}    ${B}${P}${P}${X}           ${B}${P}${X}      ${B}${P}${X}               ${B}${P}${P}${X}    ${B}${P}${P}${X}             ${B}${P}${X}      ${B}${P}${X}\n"
printf "       ${D}${P}${P}${P}${X}    ${D}${P}${P}${P}${X}       ${D}${P}${P}${X}      ${D}${P}${P}${X}           ${D}${P}${P}${P}${X}    ${D}${P}${P}${P}${X}         ${D}${P}${P}${X}      ${D}${P}${P}${X}\n"

echo ""
echo -e "\033[1m                              WALKING UP\033[0m"
echo ""
echo "       Frame 1              Frame 2              Frame 3              Frame 4"
echo ""

# Back view - no face details visible
printf "         ${D}${P}${B}${P}${P}${P}${D}${P}${X}               ${D}${P}${B}${P}${P}${P}${D}${P}${X}               ${D}${P}${B}${P}${P}${P}${D}${P}${X}               ${D}${P}${B}${P}${P}${P}${D}${P}${X}\n"
printf "       ${D}${P}${B}${P}${P}${P}${P}${P}${D}${P}${X}           ${D}${P}${B}${P}${P}${P}${P}${P}${D}${P}${X}           ${D}${P}${B}${P}${P}${P}${P}${P}${D}${P}${X}           ${D}${P}${B}${P}${P}${P}${P}${P}${D}${P}${X}\n"
printf "       ${B}${P}${P}${P}${P}${P}${P}${P}${P}${P}${B}${P}${X}           ${B}${P}${P}${P}${P}${P}${P}${P}${P}${P}${B}${P}${X}           ${B}${P}${P}${P}${P}${P}${P}${P}${P}${P}${B}${P}${X}           ${B}${P}${P}${P}${P}${P}${P}${P}${P}${P}${B}${P}${X}\n"
printf "       ${B}${P}${P}${P}${P}${P}${P}${P}${P}${P}${B}${P}${X}           ${B}${P}${P}${P}${P}${P}${P}${P}${P}${P}${B}${P}${X}           ${B}${P}${P}${P}${P}${P}${P}${P}${P}${P}${B}${P}${X}           ${B}${P}${P}${P}${P}${P}${P}${P}${P}${P}${B}${P}${X}\n"
printf "       ${B}${P}${P}${P}${P}${P}${P}${P}${P}${P}${B}${P}${X}           ${B}${P}${P}${P}${P}${P}${P}${P}${P}${P}${B}${P}${X}           ${B}${P}${P}${P}${P}${P}${P}${P}${P}${P}${B}${P}${X}           ${B}${P}${P}${P}${P}${P}${P}${P}${P}${P}${B}${P}${X}\n"
printf "       ${B}${P}${P}${P}${P}${P}${P}${P}${P}${P}${B}${P}${X}           ${B}${P}${P}${P}${P}${P}${P}${P}${P}${P}${B}${P}${X}           ${B}${P}${P}${P}${P}${P}${P}${P}${P}${P}${B}${P}${X}           ${B}${P}${P}${P}${P}${P}${P}${P}${P}${P}${B}${P}${X}\n"
printf "         ${D}${P}${B}${P}${P}${P}${P}${P}${D}${P}${X}               ${D}${P}${B}${P}${P}${P}${P}${P}${D}${P}${X}               ${D}${P}${B}${P}${P}${P}${P}${P}${D}${P}${X}               ${D}${P}${B}${P}${P}${P}${P}${P}${D}${P}${X}\n"
printf "           ${R}${P}${D}${P}${P}${P}${R}${P}${X}                   ${R}${P}${D}${P}${P}${P}${R}${P}${X}                   ${R}${P}${D}${P}${P}${P}${R}${P}${X}                   ${R}${P}${D}${P}${P}${P}${R}${P}${X}\n"
printf "       ${B}${P}${P}${R}${P}${B}${P}${P}${P}${P}${R}${P}${B}${P}${P}${X}           ${B}${P}${P}${R}${P}${B}${P}${P}${P}${P}${R}${P}${B}${P}${P}${X}           ${B}${P}${P}${R}${P}${B}${P}${P}${P}${P}${R}${P}${B}${P}${P}${X}           ${B}${P}${P}${R}${P}${B}${P}${P}${P}${P}${R}${P}${B}${P}${P}${X}\n"
printf "       ${B}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${B}${P}${X}           ${B}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${B}${P}${X}           ${B}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${B}${P}${X}           ${B}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${B}${P}${X}\n"
printf "       ${B}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${B}${P}${X}           ${B}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${B}${P}${X}           ${B}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${B}${P}${X}           ${B}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${B}${P}${X}\n"
printf "         ${B}${P}${R}${P}${B}${P}${P}${R}${P}${B}${P}${X}               ${B}${P}${R}${P}${B}${P}${P}${R}${P}${B}${P}${X}               ${B}${P}${R}${P}${B}${P}${P}${R}${P}${B}${P}${X}               ${B}${P}${R}${P}${B}${P}${P}${R}${P}${B}${P}${X}\n"
printf "         ${D}${P}${R}${P}${B}${P}${P}${R}${P}${D}${P}${X}               ${D}${P}${R}${P}${B}${P}${P}${R}${P}${D}${P}${X}               ${D}${P}${R}${P}${B}${P}${P}${R}${P}${D}${P}${X}               ${D}${P}${R}${P}${B}${P}${P}${R}${P}${D}${P}${X}\n"
printf "           ${B}${P}${D}${P}${P}${P}${B}${P}${X}                   ${B}${P}${D}${P}${P}${P}${B}${P}${X}                   ${B}${P}${D}${P}${P}${P}${B}${P}${X}                   ${B}${P}${D}${P}${P}${P}${B}${P}${X}\n"
printf "         ${B}${P}${P}${X}    ${B}${P}${P}${X}             ${B}${P}${P}${X}${B}${P}${P}${X}                   ${B}${P}${P}${X}    ${B}${P}${P}${X}               ${B}${P}${P}${B}${P}${P}${X}\n"
printf "         ${B}${P}${R}${P}${X}    ${R}${P}${B}${P}${X}           ${B}${P}${R}${P}${R}${P}${B}${P}${X}                 ${B}${P}${R}${P}${X}    ${R}${P}${B}${P}${X}             ${B}${P}${R}${P}${R}${P}${B}${P}${X}\n"
printf "         ${B}${P}${P}${X}    ${B}${P}${P}${X}           ${B}${P}${X}      ${B}${P}${X}               ${B}${P}${P}${X}    ${B}${P}${P}${X}             ${B}${P}${X}      ${B}${P}${X}\n"
printf "       ${D}${P}${P}${P}${X}    ${D}${P}${P}${P}${X}       ${D}${P}${P}${X}      ${D}${P}${P}${X}           ${D}${P}${P}${P}${X}    ${D}${P}${P}${P}${X}         ${D}${P}${P}${X}      ${D}${P}${P}${X}\n"

echo ""
echo -e "\033[1m                              WALKING LEFT\033[0m"
echo ""
echo "       Frame 1              Frame 2              Frame 3              Frame 4"
echo ""

# Side profile facing left - eye on left side
printf "           ${D}${P}${B}${P}${P}${D}${P}${X}                   ${D}${P}${B}${P}${P}${D}${P}${X}                   ${D}${P}${B}${P}${P}${D}${P}${X}                   ${D}${P}${B}${P}${P}${D}${P}${X}\n"
printf "         ${D}${P}${B}${P}${P}${P}${P}${D}${P}${X}               ${D}${P}${B}${P}${P}${P}${P}${D}${P}${X}               ${D}${P}${B}${P}${P}${P}${P}${D}${P}${X}               ${D}${P}${B}${P}${P}${P}${P}${D}${P}${X}\n"
printf "         ${B}${P}${H}${P}${B}${P}${P}${P}${P}${X}               ${B}${P}${H}${P}${B}${P}${P}${P}${P}${X}               ${B}${P}${H}${P}${B}${P}${P}${P}${P}${X}               ${B}${P}${H}${P}${B}${P}${P}${P}${P}${X}\n"
printf "         ${R}${P}${P}${B}${P}${P}${P}${P}${X}               ${R}${P}${P}${B}${P}${P}${P}${P}${X}               ${R}${P}${P}${B}${P}${P}${P}${P}${X}               ${R}${P}${P}${B}${P}${P}${P}${P}${X}\n"
printf "         ${r}${P}${P}${B}${P}${P}${P}${P}${X}               ${r}${P}${P}${B}${P}${P}${P}${P}${X}               ${r}${P}${P}${B}${P}${P}${P}${P}${X}               ${r}${P}${P}${B}${P}${P}${P}${P}${X}\n"
printf "         ${B}${P}${P}${P}${P}${P}${P}${P}${X}               ${B}${P}${P}${P}${P}${P}${P}${P}${X}               ${B}${P}${P}${P}${P}${P}${P}${P}${X}               ${B}${P}${P}${P}${P}${P}${P}${P}${X}\n"
printf "           ${D}${P}${B}${P}${P}${P}${D}${P}${X}                   ${D}${P}${B}${P}${P}${P}${D}${P}${X}                   ${D}${P}${B}${P}${P}${P}${D}${P}${X}                   ${D}${P}${B}${P}${P}${P}${D}${P}${X}\n"
printf "           ${R}${P}${D}${P}${P}${R}${P}${X}                   ${R}${P}${D}${P}${P}${R}${P}${X}                   ${R}${P}${D}${P}${P}${R}${P}${X}                   ${R}${P}${D}${P}${P}${R}${P}${X}\n"
printf "       ${B}${P}${P}${R}${P}${B}${P}${P}${P}${P}${X}               ${B}${P}${P}${R}${P}${B}${P}${P}${P}${P}${X}               ${B}${P}${P}${R}${P}${B}${P}${P}${P}${P}${X}               ${B}${P}${P}${R}${P}${B}${P}${P}${P}${P}${X}\n"
printf "       ${B}${P}${D}${P}${R}${P}${B}${P}${P}${P}${X}               ${B}${P}${D}${P}${R}${P}${B}${P}${P}${P}${X}               ${B}${P}${D}${P}${R}${P}${B}${P}${P}${P}${X}               ${B}${P}${D}${P}${R}${P}${B}${P}${P}${P}${X}\n"
printf "         ${B}${P}${R}${P}${B}${P}${P}${P}${X}                 ${B}${P}${R}${P}${B}${P}${P}${P}${X}                 ${B}${P}${R}${P}${B}${P}${P}${P}${X}                 ${B}${P}${R}${P}${B}${P}${P}${P}${X}\n"
printf "         ${D}${P}${R}${P}${D}${P}${P}${P}${X}                 ${D}${P}${R}${P}${D}${P}${P}${P}${X}                 ${D}${P}${R}${P}${D}${P}${P}${P}${X}                 ${D}${P}${R}${P}${D}${P}${P}${P}${X}\n"
printf "           ${B}${P}${D}${P}${P}${X}                     ${B}${P}${D}${P}${P}${X}                     ${B}${P}${D}${P}${P}${X}                     ${B}${P}${D}${P}${P}${X}\n"
# Legs animated - walking left
printf "         ${B}${P}${P}${B}${P}${P}${X}               ${B}${P}${P}${X}  ${B}${P}${P}${X}               ${B}${P}${P}${B}${P}${P}${X}                 ${B}${P}${P}${X}  ${B}${P}${P}${X}\n"
printf "         ${B}${P}${R}${P}${R}${P}${B}${P}${X}             ${B}${P}${R}${P}${X}  ${R}${P}${B}${P}${X}             ${B}${P}${R}${P}${R}${P}${B}${P}${X}               ${B}${P}${R}${P}${X}  ${R}${P}${B}${P}${X}\n"
printf "         ${B}${P}${X}    ${B}${P}${X}             ${B}${P}${P}${X}  ${B}${P}${P}${X}             ${B}${P}${X}    ${B}${P}${X}               ${B}${P}${P}${X}  ${B}${P}${P}${X}\n"
printf "       ${D}${P}${P}${X}    ${D}${P}${P}${X}         ${D}${P}${P}${P}${X}  ${D}${P}${P}${P}${X}         ${D}${P}${P}${X}    ${D}${P}${P}${X}           ${D}${P}${P}${P}${X}  ${D}${P}${P}${P}${X}\n"

echo ""
echo -e "\033[1m                              WALKING RIGHT\033[0m"
echo ""
echo "       Frame 1              Frame 2              Frame 3              Frame 4"
echo ""

# Side profile facing right - eye on right side
printf "         ${D}${P}${P}${B}${P}${D}${P}${X}                 ${D}${P}${P}${B}${P}${D}${P}${X}                 ${D}${P}${P}${B}${P}${D}${P}${X}                 ${D}${P}${P}${B}${P}${D}${P}${X}\n"
printf "         ${D}${P}${P}${P}${P}${B}${P}${D}${P}${X}               ${D}${P}${P}${P}${P}${B}${P}${D}${P}${X}               ${D}${P}${P}${P}${P}${B}${P}${D}${P}${X}               ${D}${P}${P}${P}${P}${B}${P}${D}${P}${X}\n"
printf "         ${B}${P}${P}${P}${P}${H}${P}${B}${P}${X}               ${B}${P}${P}${P}${P}${H}${P}${B}${P}${X}               ${B}${P}${P}${P}${P}${H}${P}${B}${P}${X}               ${B}${P}${P}${P}${P}${H}${P}${B}${P}${X}\n"
printf "         ${B}${P}${P}${P}${P}${P}${R}${P}${X}               ${B}${P}${P}${P}${P}${P}${R}${P}${X}               ${B}${P}${P}${P}${P}${P}${R}${P}${X}               ${B}${P}${P}${P}${P}${P}${R}${P}${X}\n"
printf "         ${B}${P}${P}${P}${P}${P}${r}${P}${X}               ${B}${P}${P}${P}${P}${P}${r}${P}${X}               ${B}${P}${P}${P}${P}${P}${r}${P}${X}               ${B}${P}${P}${P}${P}${P}${r}${P}${X}\n"
printf "         ${B}${P}${P}${P}${P}${P}${P}${P}${X}               ${B}${P}${P}${P}${P}${P}${P}${P}${X}               ${B}${P}${P}${P}${P}${P}${P}${P}${X}               ${B}${P}${P}${P}${P}${P}${P}${P}${X}\n"
printf "         ${D}${P}${P}${P}${B}${P}${D}${P}${X}                 ${D}${P}${P}${P}${B}${P}${D}${P}${X}                 ${D}${P}${P}${P}${B}${P}${D}${P}${X}                 ${D}${P}${P}${P}${B}${P}${D}${P}${X}\n"
printf "         ${R}${P}${P}${D}${P}${R}${P}${X}                   ${R}${P}${P}${D}${P}${R}${P}${X}                   ${R}${P}${P}${D}${P}${R}${P}${X}                   ${R}${P}${P}${D}${P}${R}${P}${X}\n"
printf "         ${B}${P}${P}${P}${P}${R}${P}${B}${P}${P}${X}               ${B}${P}${P}${P}${P}${R}${P}${B}${P}${P}${X}               ${B}${P}${P}${P}${P}${R}${P}${B}${P}${P}${X}               ${B}${P}${P}${P}${P}${R}${P}${B}${P}${P}${X}\n"
printf "         ${B}${P}${P}${P}${R}${P}${D}${P}${B}${P}${X}               ${B}${P}${P}${P}${R}${P}${D}${P}${B}${P}${X}               ${B}${P}${P}${P}${R}${P}${D}${P}${B}${P}${X}               ${B}${P}${P}${P}${R}${P}${D}${P}${B}${P}${X}\n"
printf "         ${B}${P}${P}${P}${R}${P}${B}${P}${X}                 ${B}${P}${P}${P}${R}${P}${B}${P}${X}                 ${B}${P}${P}${P}${R}${P}${B}${P}${X}                 ${B}${P}${P}${P}${R}${P}${B}${P}${X}\n"
printf "         ${D}${P}${P}${P}${R}${P}${D}${P}${X}                 ${D}${P}${P}${P}${R}${P}${D}${P}${X}                 ${D}${P}${P}${P}${R}${P}${D}${P}${X}                 ${D}${P}${P}${P}${R}${P}${D}${P}${X}\n"
printf "           ${B}${P}${D}${P}${B}${P}${X}                     ${B}${P}${D}${P}${B}${P}${X}                     ${B}${P}${D}${P}${B}${P}${X}                     ${B}${P}${D}${P}${B}${P}${X}\n"
# Legs animated - walking right
printf "         ${B}${P}${P}${B}${P}${P}${X}                 ${B}${P}${P}${X}  ${B}${P}${P}${X}               ${B}${P}${P}${B}${P}${P}${X}                 ${B}${P}${P}${X}  ${B}${P}${P}${X}\n"
printf "         ${B}${P}${R}${P}${R}${P}${B}${P}${X}               ${B}${P}${R}${P}${X}  ${R}${P}${B}${P}${X}             ${B}${P}${R}${P}${R}${P}${B}${P}${X}               ${B}${P}${R}${P}${X}  ${R}${P}${B}${P}${X}\n"
printf "         ${B}${P}${X}    ${B}${P}${X}               ${B}${P}${P}${X}  ${B}${P}${P}${X}             ${B}${P}${X}    ${B}${P}${X}               ${B}${P}${P}${X}  ${B}${P}${P}${X}\n"
printf "       ${D}${P}${P}${X}    ${D}${P}${P}${X}           ${D}${P}${P}${P}${X}  ${D}${P}${P}${P}${X}         ${D}${P}${P}${X}    ${D}${P}${P}${X}           ${D}${P}${P}${P}${X}  ${D}${P}${P}${P}${X}\n"

echo ""
