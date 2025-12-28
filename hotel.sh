#!/bin/bash
# Hotel - Exterior View (Front Facade)
# Using ANSI 24-bit color codes

clear
echo ""
echo "  ╔══════════════════════════════════════════════════════════════════════╗"
echo "  ║                    GRAND HOTEL - EXTERIOR VIEW                       ║"
echo "  ╚══════════════════════════════════════════════════════════════════════╝"
echo ""

# Colors
SKY="\033[48;2;135;180;220m"
WALL="\033[48;2;180;160;140m"
WIN="\033[48;2;100;140;180m"
WIN_LIT="\033[48;2;255;230;150m"
WIN_FRAME="\033[48;2;80;70;60m"
ROOF="\033[48;2;100;80;70m"
ROOF_H="\033[48;2;120;100;90m"
GROUND="\033[48;2;80;80;80m"
GRASS="\033[48;2;60;120;50m"
DOOR="\033[48;2;120;60;40m"
DOOR_H="\033[48;2;160;100;60m"
GLASS="\033[48;2;180;200;210m"
AWN="\033[48;2;160;40;40m"
AWN_S="\033[48;2;120;30;30m"
SIGN="\033[48;2;40;40;50m"
SIGN_LIT="\033[48;2;255;200;100m"
TRIM="\033[48;2;200;190;170m"
PLANT="\033[48;2;40;100;40m"
LAMP="\033[48;2;60;60;60m"
LAMP_ON="\033[48;2;255;240;200m"
X="\033[0m"
P="  "

# SKY
echo -e "${SKY}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${X}"
echo -e "${SKY}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${X}"

# ROOF
echo -e "${SKY}${P}${P}${P}${P}${P}${P}${ROOF}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${SKY}${P}${P}${P}${P}${P}${X}"
echo -e "${SKY}${P}${P}${P}${P}${P}${ROOF}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${SKY}${P}${P}${P}${P}${X}"
echo -e "${SKY}${P}${P}${P}${P}${ROOF_H}${ROOF}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${ROOF}${SKY}${P}${P}${P}${X}"

# ROOF EDGE / TRIM
echo -e "${SKY}${P}${P}${P}${TRIM}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${TRIM}${SKY}${P}${P}${X}"

# FLOOR 5
echo -e "${SKY}${P}${P}${P}${WALL}${P}${WIN_FRAME}${WIN}${P}${WIN_FRAME}${WALL}${P}${WIN_FRAME}${WIN}${P}${WIN_FRAME}${WALL}${P}${WIN_FRAME}${WIN}${P}${WIN_FRAME}${WALL}${P}${WIN_FRAME}${WIN}${P}${WIN_FRAME}${WALL}${P}${WIN_FRAME}${WIN}${P}${WIN_FRAME}${WALL}${SKY}${P}${P}${X}"
echo -e "${SKY}${P}${P}${P}${WALL}${P}${WIN_FRAME}${WIN}${P}${WIN_FRAME}${WALL}${P}${WIN_FRAME}${WIN}${P}${WIN_FRAME}${WALL}${P}${WIN_FRAME}${WIN}${P}${WIN_FRAME}${WALL}${P}${WIN_FRAME}${WIN}${P}${WIN_FRAME}${WALL}${P}${WIN_FRAME}${WIN}${P}${WIN_FRAME}${WALL}${SKY}${P}${P}${X}"
echo -e "${SKY}${P}${P}${P}${WALL}${P}${P}${P}${P}${P}${WALL}${P}${P}${P}${P}${P}${WALL}${P}${P}${P}${P}${P}${WALL}${P}${P}${P}${P}${P}${WALL}${P}${P}${P}${P}${P}${WALL}${SKY}${P}${P}${X}"

# FLOOR 4
echo -e "${SKY}${P}${P}${P}${WALL}${P}${WIN_FRAME}${WIN_LIT}${P}${WIN_FRAME}${WALL}${P}${WIN_FRAME}${WIN}${P}${WIN_FRAME}${WALL}${P}${WIN_FRAME}${WIN_LIT}${P}${WIN_FRAME}${WALL}${P}${WIN_FRAME}${WIN}${P}${WIN_FRAME}${WALL}${P}${WIN_FRAME}${WIN_LIT}${P}${WIN_FRAME}${WALL}${SKY}${P}${P}${X}"
echo -e "${SKY}${P}${P}${P}${WALL}${P}${WIN_FRAME}${WIN_LIT}${P}${WIN_FRAME}${WALL}${P}${WIN_FRAME}${WIN}${P}${WIN_FRAME}${WALL}${P}${WIN_FRAME}${WIN_LIT}${P}${WIN_FRAME}${WALL}${P}${WIN_FRAME}${WIN}${P}${WIN_FRAME}${WALL}${P}${WIN_FRAME}${WIN_LIT}${P}${WIN_FRAME}${WALL}${SKY}${P}${P}${X}"
echo -e "${SKY}${P}${P}${P}${WALL}${P}${P}${P}${P}${P}${WALL}${P}${P}${P}${P}${P}${WALL}${P}${P}${P}${P}${P}${WALL}${P}${P}${P}${P}${P}${WALL}${P}${P}${P}${P}${P}${WALL}${SKY}${P}${P}${X}"

# FLOOR 3
echo -e "${SKY}${P}${P}${P}${WALL}${P}${WIN_FRAME}${WIN}${P}${WIN_FRAME}${WALL}${P}${WIN_FRAME}${WIN_LIT}${P}${WIN_FRAME}${WALL}${P}${WIN_FRAME}${WIN}${P}${WIN_FRAME}${WALL}${P}${WIN_FRAME}${WIN_LIT}${P}${WIN_FRAME}${WALL}${P}${WIN_FRAME}${WIN}${P}${WIN_FRAME}${WALL}${SKY}${P}${P}${X}"
echo -e "${SKY}${P}${P}${P}${WALL}${P}${WIN_FRAME}${WIN}${P}${WIN_FRAME}${WALL}${P}${WIN_FRAME}${WIN_LIT}${P}${WIN_FRAME}${WALL}${P}${WIN_FRAME}${WIN}${P}${WIN_FRAME}${WALL}${P}${WIN_FRAME}${WIN_LIT}${P}${WIN_FRAME}${WALL}${P}${WIN_FRAME}${WIN}${P}${WIN_FRAME}${WALL}${SKY}${P}${P}${X}"
echo -e "${SKY}${P}${P}${P}${WALL}${P}${P}${P}${P}${P}${WALL}${P}${P}${P}${P}${P}${WALL}${P}${P}${P}${P}${P}${WALL}${P}${P}${P}${P}${P}${WALL}${P}${P}${P}${P}${P}${WALL}${SKY}${P}${P}${X}"

# FLOOR 2
echo -e "${SKY}${P}${P}${P}${WALL}${P}${WIN_FRAME}${WIN_LIT}${P}${WIN_FRAME}${WALL}${P}${WIN_FRAME}${WIN_LIT}${P}${WIN_FRAME}${WALL}${P}${WIN_FRAME}${WIN}${P}${WIN_FRAME}${WALL}${P}${WIN_FRAME}${WIN}${P}${WIN_FRAME}${WALL}${P}${WIN_FRAME}${WIN_LIT}${P}${WIN_FRAME}${WALL}${SKY}${P}${P}${X}"
echo -e "${SKY}${P}${P}${P}${WALL}${P}${WIN_FRAME}${WIN_LIT}${P}${WIN_FRAME}${WALL}${P}${WIN_FRAME}${WIN_LIT}${P}${WIN_FRAME}${WALL}${P}${WIN_FRAME}${WIN}${P}${WIN_FRAME}${WALL}${P}${WIN_FRAME}${WIN}${P}${WIN_FRAME}${WALL}${P}${WIN_FRAME}${WIN_LIT}${P}${WIN_FRAME}${WALL}${SKY}${P}${P}${X}"
echo -e "${SKY}${P}${P}${P}${WALL}${P}${P}${P}${P}${P}${WALL}${P}${P}${P}${P}${P}${WALL}${P}${P}${P}${P}${P}${WALL}${P}${P}${P}${P}${P}${WALL}${P}${P}${P}${P}${P}${WALL}${SKY}${P}${P}${X}"

# HOTEL SIGN
echo -e "${SKY}${P}${P}${P}${WALL}${P}${P}${P}${P}${P}${SIGN}${P}${SIGN_LIT}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${SIGN_LIT}${P}${SIGN}${P}${P}${P}${P}${P}${WALL}${SKY}${P}${P}${X}"

# FLOOR 1 - ENTRANCE
echo -e "${SKY}${P}${P}${P}${WALL}${P}${WIN_FRAME}${WIN}${P}${WIN_FRAME}${WALL}${P}${P}${P}${GLASS}${GLASS}${GLASS}${GLASS}${GLASS}${GLASS}${GLASS}${GLASS}${GLASS}${GLASS}${P}${P}${WALL}${P}${WIN_FRAME}${WIN}${P}${WIN_FRAME}${WALL}${SKY}${P}${P}${X}"
echo -e "${SKY}${P}${P}${P}${WALL}${P}${WIN_FRAME}${WIN}${P}${WIN_FRAME}${WALL}${P}${P}${P}${GLASS}${GLASS}${DOOR}${DOOR}${DOOR}${DOOR}${DOOR}${DOOR}${GLASS}${GLASS}${P}${P}${WALL}${P}${WIN_FRAME}${WIN}${P}${WIN_FRAME}${WALL}${SKY}${P}${P}${X}"
echo -e "${SKY}${P}${P}${P}${WALL}${P}${P}${P}${P}${P}${WALL}${P}${P}${P}${GLASS}${GLASS}${DOOR}${DOOR_H}${DOOR}${DOOR}${DOOR_H}${DOOR}${GLASS}${GLASS}${P}${P}${WALL}${P}${P}${P}${P}${P}${WALL}${SKY}${P}${P}${X}"

# AWNING
echo -e "${SKY}${P}${P}${P}${WALL}${P}${P}${P}${P}${AWN}${AWN}${AWN}${AWN}${AWN}${AWN}${AWN}${AWN}${AWN}${AWN}${AWN}${AWN}${AWN}${AWN}${AWN}${AWN}${AWN}${AWN}${P}${P}${P}${P}${WALL}${SKY}${P}${P}${X}"
echo -e "${SKY}${P}${P}${P}${WALL}${P}${P}${P}${AWN_S}${AWN}${AWN_S}${AWN}${AWN_S}${AWN}${AWN_S}${AWN}${AWN_S}${AWN}${AWN_S}${AWN}${AWN_S}${AWN}${AWN_S}${AWN}${AWN_S}${AWN}${AWN_S}${P}${P}${P}${WALL}${SKY}${P}${P}${X}"

# ENTRANCE GROUND LEVEL
echo -e "${SKY}${P}${P}${LAMP}${WALL}${P}${PLANT}${P}${P}${P}${P}${P}${P}${GLASS}${GLASS}${DOOR}${DOOR_H}${DOOR}${DOOR}${DOOR_H}${DOOR}${GLASS}${GLASS}${P}${P}${P}${P}${P}${P}${PLANT}${P}${WALL}${LAMP}${SKY}${P}${X}"
echo -e "${SKY}${P}${P}${LAMP_ON}${WALL}${P}${PLANT}${P}${P}${P}${P}${P}${P}${GLASS}${GLASS}${GLASS}${GLASS}${GLASS}${GLASS}${GLASS}${GLASS}${GLASS}${GLASS}${P}${P}${P}${P}${P}${P}${PLANT}${P}${WALL}${LAMP_ON}${SKY}${P}${X}"

# GROUND / SIDEWALK
echo -e "${GRASS}${P}${P}${GROUND}${GROUND}${GROUND}${GROUND}${GROUND}${GROUND}${GROUND}${GROUND}${GROUND}${GROUND}${GROUND}${GROUND}${GROUND}${GROUND}${GROUND}${GROUND}${GROUND}${GROUND}${GROUND}${GROUND}${GROUND}${GROUND}${GROUND}${GROUND}${GROUND}${GROUND}${GROUND}${GROUND}${GROUND}${GROUND}${GRASS}${P}${X}"
echo -e "${GRASS}${P}${P}${P}${GROUND}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${GROUND}${P}${GRASS}${P}${X}"
echo -e "${GRASS}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${P}${X}"

echo ""
echo "  ┌──────────────────────────────────────────────────────────────────────┐"
echo "  │  LEGEND                                                              │"
echo "  ├──────────────────────────────────────────────────────────────────────┤"
echo -e "  │  ${WALL}  ${X} Wall    ${WIN}  ${X} Window (dark)   ${WIN_LIT}  ${X} Window (lit)              │"
echo -e "  │  ${ROOF}  ${X} Roof    ${DOOR}  ${X} Door            ${GLASS}  ${X} Glass                      │"
echo -e "  │  ${AWN}  ${X} Awning  ${PLANT}  ${X} Plants          ${LAMP_ON}  ${X} Lamp                       │"
echo -e "  │  ${GROUND}  ${X} Ground  ${GRASS}  ${X} Grass           ${SIGN_LIT}  ${X} Sign lights                │"
echo "  └──────────────────────────────────────────────────────────────────────┘"
echo ""
echo "  5-story hotel with central glass entrance, red awning, and lit windows"
echo ""
