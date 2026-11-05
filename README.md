# Griffin Rock Rescue Bots: 3D Open World

An interactive, 3D open-world fan game inspired by *Transformers: Rescue Bots*. Explore the island of Griffin Rock, respond to emergencies, transform between Robot, Vehicle, and Dinobot modes, and team up with your AI wingman partner.

---

> ### ⚠️ Legal Disclaimer & Unofficial Fan Project Notice
>
> **This is an unofficial, non-commercial fan tribute project.**
>
> - **TRANSFORMERS**, **RESCUE BOTS**, and all associated characters, names, vehicle designs, logos, and fictional settings (including *Optimus Prime*, *Boulder*, *Heatwave*, *Chase*, *Blades*, *Bumblebee*, *Blurr*, *Salvage*, *High Tide*, *Quickshadow*, *Dr. Morocco*, and *Griffin Rock*) are registered trademarks and copyrights of **Hasbro, Inc.**
> - This software is **not** produced, authorized, sponsored, or endorsed by Hasbro, Inc. or any of its affiliates.
> - This project is completely **free and non-commercial**. There are **no ads, no microtransactions, and no donations or monetization** of any kind.
> - The source code and procedural algorithms are shared under the [MIT License](LICENSE) for educational and learning purposes. The MIT license applies **solely to the original software code** and does not grant any rights to Hasbro's intellectual property.
> - For full details, please review the [NOTICE](NOTICE) file.

---

## 🎮 Features

- **10 Articulated Rescue Bots**:
  - **Boulder** (Bulldozer / Triceratops)
  - **Heatwave** (Fire Engine / Brachiosaur)
  - **Chase** (Police Interceptor / Stegosaurus)
  - **Blades** (Rescue Helicopter / Pterosaur)
  - **Optimus Prime** (Heavy Semi-Truck Cab / T-Rex) — *Titan Commander Scale*
  - **High Tide** (Armored Submersible / Plesiosaur) — *Deep-Ocean Titan Scale*
  - **Bumblebee** (Sports Car / Velociraptor)
  - **Blurr** (Racecar / Gallimimus)
  - **Salvage** (Recycling Truck / Ankylosaur)
  - **Quickshadow** (Covert Luxury Coupe / Dilophosaur)
- **Triple-Mode Articulation**: Real-time smooth transformation between **Bot Mode**, **Vehicle Mode**, and **Dinobot Mode**.
- **AI Wingman Buddy Bot**: Choose any bot to follow you into missions as your autonomous AI partner.
- **Vast 3D Island of Griffin Rock**:
  - **Rescue Bots HQ**: Working garage with transparent apparatus bays, rooftop helipad, and character swap bay.
  - **Interactive Island Stations**: Super Catapult launch pad, Robo-Wash car wash, South Harbor magnetic crane, functioning Rescue Ferry, and Drive-Thru Diner.
  - **Doc Greene's Anti-Gravity Testing Yard**: Supersonic speed strip, mega-bounce pad, color splat targets, and test arena.
  - **GroundBridge Network**: Instant portal teleportation between island sectors.
  - **Island Railway Loop**: Scenic railway circuit with the Griffin Rock Express train.
  - **8 Island-Wide Emergencies & Dynamic Weather**: Responding to rockslides, blazes, and lava leaks with kid-friendly smart auto-rescue.
- **Griffin Rock Tactical Island Map**: Full-screen radar overlay with live GPS tracking and tap-to-autopilot navigation.

---

## 🚀 How to Run Locally

Because this game is built entirely in a self-contained, standalone web architecture, no build tools or package installations are required!

### Option 1: Direct Browser Launch
Simply double-click `index.html` or open it directly in any modern web browser (Chrome, Safari, Firefox, Edge).

### Option 2: Local HTTP Server (Recommended)
Running through a local web server ensures optimal asset caching and audio context initialization:

```bash
# Using Python 3:
python3 -m http.server 8000

# Or using Node:
npx serve .
```

Then visit [http://localhost:8000](http://localhost:8000) in your browser.

---

## ⌨️ Controls

| Action | Keyboard / Mouse | Touch / Mobile |
| :--- | :--- | :--- |
| **Move / Drive** | `W`/`S` or `↑`/`↓` | Touch & drag or tap on terrain / road |
| **Steer** | `A`/`D` or `←`/`→` | Tap to move or drag |
| **Transform** | `Spacebar` / `T` | Yellow **TRANSFORM** button |
| **Primary Power** | `E` / `Enter` | Blue **ACTION** button |
| **Secondary Power / Ascend** | `Q` (Ascend for Blades) | Blue **ASCEND** button |
| **Descend** | `C` (Descend for Blades) | Blue **DESCEND** button |
| **Tactical Island Map** | `M` | Top-left **MINIMAP** / **MAP** button |
| **Cycle Buddy Bot** | `B` | Buddy Bot pill button in roster |
| **Change Camera View** | `V` | Menu -> **View Mode** |
| **Emergency Siren** | `H` | In-game HUD toggle |

---

## 📄 License & Attribution

- **Software Code**: Released under the [MIT License](LICENSE).
- **Trademarks & Characters**: All *Transformers* and *Rescue Bots* names, likenesses, and logos are © & ™ **Hasbro, Inc.** See [NOTICE](NOTICE) for details.
