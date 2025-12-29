# 2026 Gutman Bingo

A fun, interactive bingo card tracker for 2026.

## Features

- 🎴 Classic bingo card design with vintage aesthetic
- 👥 Support for multiple players (configure in YAML)
- 📱 Fully responsive - works great on mobile and desktop
- 🎉 Animated confetti celebration when you get a bingo!
- 🎨 Fun "YOU WIN!!!" flashing text on bingo

## Setup

1. Open `index.html` in a web browser
2. That's it! No build process or dependencies needed.

## Configuration

Edit `bingo.yaml` to customize your bingo cards:

```yaml
people:
  PersonName:
    items:
      - text: "Activity description"
        marked: false
      - text: "Another activity"
        marked: false
      # ... 25 items total (including FREE SPACE)
      - text: "FREE SPACE"
        marked: true
```

**Important:** Each person must have exactly 25 items. The FREE SPACE should be at position 13 (index 12) for proper centering.

## File Structure

- `index.html` - Main HTML file
- `style.css` - All styling including bingo card design and animations
- `app.js` - Game logic, bingo detection, and confetti
- `bingo.yaml` - Configuration file for all bingo cards

## License

A clanker wrote this. Do whatever the hell you want.
