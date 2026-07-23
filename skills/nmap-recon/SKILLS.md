# Skill: Nmap Network Reconnaissance

## Overview
Procedural skill for network target auditing using Nmap on Kali Linux.

## Execution Steps
1. Initial Fast Scan: `nmap -F <target>`
2. Service Version Detection: `nmap -sV -sC -p <ports> <target>`
3. Output Parsing: Extract open TCP/UDP ports and service banners.
