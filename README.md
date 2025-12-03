# Countdown Card for Home Assistant

[![hacs_badge](https://img.shields.io/badge/HACS-Custom-41BDF5.svg)](https://github.com/hacs/integration)

A beautiful countdown card for Home Assistant, inspired by [itsalmo.st](https://itsalmo.st). Shows a live countdown with months, days, hours, minutes, seconds, and milliseconds - with celebratory confetti when the event arrives!


## Features

- Beautiful gradient design with glassmorphism effects
- Real-time countdown with milliseconds
- Continuous confetti celebration when countdown reaches zero
- Multi-language support (English, Dutch)
- Dark and light themes
- Fully responsive design
- Smooth hover animations
- Visual card editor support

## Installation

### HACS

1. Open HACS in Home Assistant
2. Click the three dots menu → **Custom repositories**
3. Add `https://github.com/wouterrutgers/hacs-countdown-card` with category **Dashboard**
4. Click **Install**
5. Restart Home Assistant
6. Add the card to your dashboard

## Usage

Add the card to your dashboard using the UI editor or YAML:

```yaml
type: custom:countdown-card
name: Christmas
datetime: "2025-12-25T00:00:00"
```

## Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `name` | string | `"Countdown"` | Event name displayed on the card |
| `datetime` | string | **Required** | Target date/time in ISO format (`YYYY-MM-DDTHH:mm:ss`) |
| `theme` | string | `"dark"` | Card theme: `"dark"` or `"light"` |
| `show_seconds` | boolean | `true` | Show seconds in countdown |
| `show_milliseconds` | boolean | `true` | Show milliseconds in countdown |

## Supported Languages

The card automatically detects your Home Assistant language setting:

| Language | "It's almost" | "It was" |
|----------|---------------|----------|
| English | It's almost | It was |
| Dutch | Het is bijna | Het was |

Want to add your language? Open a PR with translations!

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see [LICENSE](LICENSE) for details.

## Credits

- Inspired by [itsalmo.st](https://itsalmo.st)
- Built for [Home Assistant](https://www.home-assistant.io/)
