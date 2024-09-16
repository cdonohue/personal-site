enum Category {
  HardwareAndPeripherals = 'Hardware and Peripherals',
  DeskAndErgonomics = 'Desk and Ergonomics',
  Videogames = 'Videogames',
  Software = 'Software',
  Miscellaneous = 'Miscellaneous',
}

type Item = {
  category: Category
  graphic: string
  title: string
  description: string
  link: string
  icon?: () => JSX.Element
}

const things: Array<Item> = [
  {
    graphic: '💻',
    title: 'MacBook Pro',
    description:
      'A laptop that looks great, is easy to setup, and packs in a lot of great hardware under the hood to make it perfect to do almost anything.',
    link: 'https://www.apple.com/macbook-pro/',
    category: Category.HardwareAndPeripherals,
    icon: () => (
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 311 169"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <mask id="path-1-inside-1_4_2" fill="white">
          <path d="M0 151.2C0 150.08 0 149.52 0.217987 149.092C0.409734 148.716 0.715695 148.41 1.09202 148.218C1.51984 148 2.0799 148 3.2 148H307.8C308.92 148 309.48 148 309.908 148.218C310.284 148.41 310.59 148.716 310.782 149.092C311 149.52 311 150.08 311 151.2V156.2C311 160.68 311 162.921 310.128 164.632C309.361 166.137 308.137 167.361 306.632 168.128C304.921 169 302.68 169 298.2 169H12.8C8.31958 169 6.07937 169 4.36808 168.128C2.86278 167.361 1.63893 166.137 0.871948 164.632C0 162.921 0 160.68 0 156.2V151.2Z" />
        </mask>
        <path
          d="M0 151.2C0 150.08 0 149.52 0.217987 149.092C0.409734 148.716 0.715695 148.41 1.09202 148.218C1.51984 148 2.0799 148 3.2 148H307.8C308.92 148 309.48 148 309.908 148.218C310.284 148.41 310.59 148.716 310.782 149.092C311 149.52 311 150.08 311 151.2V156.2C311 160.68 311 162.921 310.128 164.632C309.361 166.137 308.137 167.361 306.632 168.128C304.921 169 302.68 169 298.2 169H12.8C8.31958 169 6.07937 169 4.36808 168.128C2.86278 167.361 1.63893 166.137 0.871948 164.632C0 162.921 0 160.68 0 156.2V151.2Z"
          fill="#8D8D86"
          stroke="#63635E"
          strokeWidth="8"
          mask="url(#path-1-inside-1_4_2)"
        />
        <path
          d="M22 12.8C22 10.5268 22.0016 8.94217 22.1024 7.70848C22.2012 6.49814 22.3856 5.80277 22.654 5.27606C23.2292 4.14708 24.1471 3.2292 25.2761 2.65396C25.8028 2.38559 26.4981 2.20124 27.7085 2.10235C28.9422 2.00156 30.5268 2 32.8 2H277.2C279.473 2 281.058 2.00156 282.292 2.10235C283.502 2.20124 284.197 2.38559 284.724 2.65396C285.853 3.2292 286.771 4.14709 287.346 5.27607C287.614 5.80277 287.799 6.49814 287.898 7.70848C287.998 8.94216 288 10.5268 288 12.8V150H22V12.8Z"
          fill="#8D8D86"
          stroke="#63635E"
          strokeWidth="4"
        />
        <rect x="31" y="10" width="248" height="133" rx="3" fill="#21201C" />
        <path
          d="M178.995 150C178.988 150.893 178.971 151.619 178.929 152.241C178.859 153.255 178.73 153.845 178.543 154.296C177.934 155.766 176.766 156.934 175.296 157.543C174.845 157.73 174.255 157.859 173.241 157.929C172.209 157.999 170.891 158 169 158H141C139.109 158 137.791 157.999 136.759 157.929C135.745 157.859 135.155 157.73 134.704 157.543C133.234 156.934 132.066 155.766 131.457 154.296C131.27 153.845 131.141 153.255 131.071 152.241C131.029 151.619 131.012 150.893 131.005 150H178.995Z"
          fill="black"
          fillOpacity="0.1"
          stroke="#63635E"
          strokeWidth="4"
        />
      </svg>
    ),
  },
  {
    title: 'Gigabyte M32U',
    description:
      'This 32-inch 4K monitor provides ample screen real estate for coding and design work, and it also doubles as a decent gaming display.',
    link: 'https://amzn.to/3RNAmPU',
    category: Category.HardwareAndPeripherals,
    graphic: '🖥',
    icon: () => (
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 270 194"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="270" height="152" rx="8" fill="#3B3A37" />
        <rect
          x="2"
          y="2"
          width="266"
          height="148"
          rx="6"
          stroke="black"
          stroke-opacity="0.22"
          stroke-width="4"
        />
        <path d="M103 152H167V182H103V152Z" fill="#252423" />
        <mask id="path-4-inside-1_31_6" fill="white">
          <rect x="90" y="182" width="90" height="12" rx="3" />
        </mask>
        <rect
          x="90"
          y="182"
          width="90"
          height="12"
          rx="3"
          fill="#3B3A37"
          stroke="#111110"
          stroke-opacity="0.22"
          stroke-width="8"
          mask="url(#path-4-inside-1_31_6)"
        />
        <rect x="8" y="8" width="254" height="136" rx="2" fill="#111110" />
      </svg>
    ),
  },
  {
    title: 'ZSA Voyager',
    description:
      'This compact, split keyboard reduces strain and boosts productivity with its customizable layout and programmable keys.',
    link: 'https://www.zsa.io/voyager/',
    category: Category.HardwareAndPeripherals,
    graphic: '⌨️',
    icon: () => (
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 264 122"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M264 2C264 0.895432 263.105 0 262 0H192C190.895 0 190 0.895431 190 2V2C190 3.10457 189.105 4 188 4H176.5C175.672 4 175 4.67157 175 5.5V5.5C175 6.32843 174.328 7 173.5 7H159C157.895 7 157 7.89543 157 9V73.9176C157 74.5929 156.659 75.2226 156.094 75.592L153.906 77.0213C153.341 77.3906 153 78.0203 153 78.6956V82.8513C153 83.5626 152.622 84.2204 152.008 84.5788L136.739 93.4853C135.781 94.0446 135.461 95.2776 136.027 96.2325L149.996 119.806C150.553 120.746 151.761 121.065 152.709 120.523L167.492 112.076C168.115 111.72 168.5 111.057 168.5 110.339V101.658C168.5 100.942 168.883 100.28 169.505 99.9236L179.699 94.0764C180.321 93.7199 180.704 93.0581 180.704 92.3415V85.4857C180.704 84.7227 181.138 84.0262 181.823 83.6901L197.083 76.2044C197.357 76.0699 197.659 76 197.964 76H224.204C225.032 76 225.704 76.6716 225.704 77.5V77.5C225.704 78.3284 226.375 79 227.204 79H262C263.105 79 264 78.1046 264 77V2Z"
          fill="#3B3A37"
        />
        <rect x="160" y="10" width="16" height="16" rx="2" fill="#111110" />
        <circle cx="168" cy="16" r="2" fill="#6F6D66" />
        <rect x="177" y="7" width="16" height="16" rx="2" fill="#111110" />
        <circle cx="185" cy="13" r="2" fill="#6F6D66" />
        <rect x="177" y="24" width="16" height="16" rx="2" fill="#111110" />
        <circle cx="185" cy="30" r="2" fill="#6F6D66" />
        <rect x="177" y="41" width="16" height="16" rx="2" fill="#111110" />
        <circle cx="185" cy="47" r="2" fill="#6F6D66" />
        <rect x="177" y="58" width="16" height="16" rx="2" fill="#111110" />
        <circle cx="185" cy="64" r="2" fill="#6F6D66" />
        <rect x="194" y="3" width="16" height="16" rx="2" fill="#111110" />
        <circle cx="202" cy="9" r="2" fill="#6F6D66" />
        <rect x="194" y="20" width="16" height="16" rx="2" fill="#111110" />
        <circle cx="202" cy="26" r="2" fill="#6F6D66" />
        <rect x="194" y="37" width="16" height="16" rx="2" fill="#111110" />
        <circle cx="202" cy="43" r="2" fill="#6F6D66" />
        <rect x="194" y="54" width="16" height="16" rx="2" fill="#111110" />
        <circle cx="202" cy="60" r="2" fill="#6F6D66" />
        <rect x="211" y="6" width="16" height="16" rx="2" fill="#111110" />
        <circle cx="219" cy="12" r="2" fill="#6F6D66" />
        <rect x="211" y="23" width="16" height="16" rx="2" fill="#111110" />
        <circle cx="219" cy="29" r="2" fill="#6F6D66" />
        <rect x="211" y="40" width="16" height="16" rx="2" fill="#111110" />
        <circle cx="219" cy="46" r="2" fill="#6F6D66" />
        <rect x="211" y="57" width="16" height="16" rx="2" fill="#111110" />
        <circle cx="219" cy="63" r="2" fill="#6F6D66" />
        <rect x="228" y="9" width="16" height="16" rx="2" fill="#111110" />
        <circle cx="236" cy="15" r="2" fill="#6F6D66" />
        <rect x="228" y="26" width="16" height="16" rx="2" fill="#111110" />
        <circle cx="236" cy="32" r="2" fill="#6F6D66" />
        <rect x="228" y="43" width="16" height="16" rx="2" fill="#111110" />
        <circle cx="236" cy="49" r="2" fill="#6F6D66" />
        <rect x="228" y="60" width="16" height="16" rx="2" fill="#111110" />
        <circle cx="236" cy="66" r="2" fill="#6F6D66" />
        <rect x="245" y="9" width="16" height="16" rx="2" fill="#111110" />
        <circle cx="253" cy="15" r="2" fill="#6F6D66" />
        <rect x="245" y="26" width="16" height="16" rx="2" fill="#111110" />
        <circle cx="253" cy="32" r="2" fill="#6F6D66" />
        <rect x="245" y="43" width="16" height="16" rx="2" fill="#111110" />
        <circle cx="253" cy="49" r="2" fill="#6F6D66" />
        <rect x="245" y="60" width="16" height="16" rx="2" fill="#111110" />
        <circle cx="253" cy="66" r="2" fill="#6F6D66" />
        <rect x="160" y="27" width="16" height="16" rx="2" fill="#111110" />
        <circle cx="168" cy="33" r="2" fill="#6F6D66" />
        <rect x="160" y="44" width="16" height="16" rx="2" fill="#111110" />
        <circle cx="168" cy="50" r="2" fill="#6F6D66" />
        <rect x="160" y="61" width="16" height="16" rx="2" fill="#111110" />
        <circle cx="168" cy="67" r="2" fill="#6F6D66" />
        <rect
          x="139"
          y="95"
          width="16"
          height="26"
          rx="2"
          transform="rotate(-30 139 95)"
          fill="#111110"
        />
        <circle
          cx="150.928"
          cy="99.6603"
          r="2"
          transform="rotate(-30 150.928 99.6603)"
          fill="#6F6D66"
        />
        <rect
          x="154"
          y="86"
          width="16"
          height="16"
          rx="2"
          transform="rotate(-30 154 86)"
          fill="#111110"
        />
        <circle
          cx="163.928"
          cy="87.1962"
          r="2"
          transform="rotate(-30 163.928 87.1962)"
          fill="#6F6D66"
        />
        <path
          d="M0 2C0 0.895432 0.895429 0 2 0H72C73.1046 0 74 0.895431 74 2V2C74 3.10457 74.8954 4 76 4H87.5C88.3284 4 89 4.67157 89 5.5V5.5C89 6.32843 89.6716 7 90.5 7H105C106.105 7 107 7.89543 107 9V73.9176C107 74.5929 107.341 75.2226 107.906 75.592L110.094 77.0213C110.659 77.3906 111 78.0203 111 78.6956V82.8513C111 83.5626 111.378 84.2204 111.992 84.5788L127.261 93.4853C128.219 94.0446 128.539 95.2776 127.973 96.2325L114.004 119.806C113.447 120.746 112.239 121.065 111.291 120.523L96.5077 112.076C95.8846 111.72 95.5 111.057 95.5 110.339V101.658C95.5 100.942 95.1167 100.28 94.4951 99.9236L84.301 94.0764C83.6794 93.7199 83.2961 93.0581 83.2961 92.3415V85.4857C83.2961 84.7227 82.8619 84.0262 82.1769 83.6901L66.9167 76.2044C66.6425 76.0699 66.3412 76 66.0359 76H39.7961C38.9677 76 38.2961 76.6716 38.2961 77.5V77.5C38.2961 78.3284 37.6245 79 36.7961 79H2C0.895427 79 0 78.1046 0 77V2Z"
          fill="#3B3A37"
        />
        <rect
          width="16"
          height="16"
          rx="2"
          transform="matrix(-1 0 0 1 104 10)"
          fill="#111110"
        />
        <circle
          cx="2"
          cy="2"
          r="2"
          transform="matrix(-1 0 0 1 98 14)"
          fill="#6F6D66"
        />
        <rect
          width="16"
          height="16"
          rx="2"
          transform="matrix(-1 0 0 1 87 7)"
          fill="#111110"
        />
        <circle
          cx="2"
          cy="2"
          r="2"
          transform="matrix(-1 0 0 1 81 11)"
          fill="#6F6D66"
        />
        <rect
          width="16"
          height="16"
          rx="2"
          transform="matrix(-1 0 0 1 87 24)"
          fill="#111110"
        />
        <circle
          cx="2"
          cy="2"
          r="2"
          transform="matrix(-1 0 0 1 81 28)"
          fill="#6F6D66"
        />
        <rect
          width="16"
          height="16"
          rx="2"
          transform="matrix(-1 0 0 1 87 41)"
          fill="#111110"
        />
        <circle
          cx="2"
          cy="2"
          r="2"
          transform="matrix(-1 0 0 1 81 45)"
          fill="#6F6D66"
        />
        <rect
          width="16"
          height="16"
          rx="2"
          transform="matrix(-1 0 0 1 87 58)"
          fill="#111110"
        />
        <circle
          cx="2"
          cy="2"
          r="2"
          transform="matrix(-1 0 0 1 81 62)"
          fill="#6F6D66"
        />
        <rect
          width="16"
          height="16"
          rx="2"
          transform="matrix(-1 0 0 1 70 3)"
          fill="#111110"
        />
        <circle
          cx="2"
          cy="2"
          r="2"
          transform="matrix(-1 0 0 1 64 7)"
          fill="#6F6D66"
        />
        <rect
          width="16"
          height="16"
          rx="2"
          transform="matrix(-1 0 0 1 70 20)"
          fill="#111110"
        />
        <circle
          cx="2"
          cy="2"
          r="2"
          transform="matrix(-1 0 0 1 64 24)"
          fill="#6F6D66"
        />
        <rect
          width="16"
          height="16"
          rx="2"
          transform="matrix(-1 0 0 1 70 37)"
          fill="#111110"
        />
        <circle
          cx="2"
          cy="2"
          r="2"
          transform="matrix(-1 0 0 1 64 41)"
          fill="#6F6D66"
        />
        <rect
          width="16"
          height="16"
          rx="2"
          transform="matrix(-1 0 0 1 70 54)"
          fill="#111110"
        />
        <circle
          cx="2"
          cy="2"
          r="2"
          transform="matrix(-1 0 0 1 64 58)"
          fill="#6F6D66"
        />
        <rect
          width="16"
          height="16"
          rx="2"
          transform="matrix(-1 0 0 1 53 6)"
          fill="#111110"
        />
        <circle
          cx="2"
          cy="2"
          r="2"
          transform="matrix(-1 0 0 1 47 10)"
          fill="#6F6D66"
        />
        <rect
          width="16"
          height="16"
          rx="2"
          transform="matrix(-1 0 0 1 53 23)"
          fill="#111110"
        />
        <circle
          cx="2"
          cy="2"
          r="2"
          transform="matrix(-1 0 0 1 47 27)"
          fill="#6F6D66"
        />
        <rect
          width="16"
          height="16"
          rx="2"
          transform="matrix(-1 0 0 1 53 40)"
          fill="#111110"
        />
        <circle
          cx="2"
          cy="2"
          r="2"
          transform="matrix(-1 0 0 1 47 44)"
          fill="#6F6D66"
        />
        <rect
          width="16"
          height="16"
          rx="2"
          transform="matrix(-1 0 0 1 53 57)"
          fill="#111110"
        />
        <circle
          cx="2"
          cy="2"
          r="2"
          transform="matrix(-1 0 0 1 47 61)"
          fill="#6F6D66"
        />
        <rect
          width="16"
          height="16"
          rx="2"
          transform="matrix(-1 0 0 1 36 9)"
          fill="#111110"
        />
        <circle
          cx="2"
          cy="2"
          r="2"
          transform="matrix(-1 0 0 1 30 13)"
          fill="#6F6D66"
        />
        <rect
          width="16"
          height="16"
          rx="2"
          transform="matrix(-1 0 0 1 36 26)"
          fill="#111110"
        />
        <circle
          cx="2"
          cy="2"
          r="2"
          transform="matrix(-1 0 0 1 30 30)"
          fill="#6F6D66"
        />
        <rect
          width="16"
          height="16"
          rx="2"
          transform="matrix(-1 0 0 1 36 43)"
          fill="#111110"
        />
        <circle
          cx="2"
          cy="2"
          r="2"
          transform="matrix(-1 0 0 1 30 47)"
          fill="#6F6D66"
        />
        <rect
          width="16"
          height="16"
          rx="2"
          transform="matrix(-1 0 0 1 36 60)"
          fill="#111110"
        />
        <circle
          cx="2"
          cy="2"
          r="2"
          transform="matrix(-1 0 0 1 30 64)"
          fill="#6F6D66"
        />
        <rect
          width="16"
          height="16"
          rx="2"
          transform="matrix(-1 0 0 1 19 9)"
          fill="#111110"
        />
        <circle
          cx="2"
          cy="2"
          r="2"
          transform="matrix(-1 0 0 1 13 13)"
          fill="#6F6D66"
        />
        <rect
          width="16"
          height="16"
          rx="2"
          transform="matrix(-1 0 0 1 19 26)"
          fill="#111110"
        />
        <circle
          cx="2"
          cy="2"
          r="2"
          transform="matrix(-1 0 0 1 13 30)"
          fill="#6F6D66"
        />
        <rect
          width="16"
          height="16"
          rx="2"
          transform="matrix(-1 0 0 1 19 43)"
          fill="#111110"
        />
        <circle
          cx="2"
          cy="2"
          r="2"
          transform="matrix(-1 0 0 1 13 47)"
          fill="#6F6D66"
        />
        <rect
          width="16"
          height="16"
          rx="2"
          transform="matrix(-1 0 0 1 19 60)"
          fill="#111110"
        />
        <circle
          cx="2"
          cy="2"
          r="2"
          transform="matrix(-1 0 0 1 13 64)"
          fill="#6F6D66"
        />
        <rect
          width="16"
          height="16"
          rx="2"
          transform="matrix(-1 0 0 1 104 27)"
          fill="#111110"
        />
        <circle
          cx="2"
          cy="2"
          r="2"
          transform="matrix(-1 0 0 1 98 31)"
          fill="#6F6D66"
        />
        <rect
          width="16"
          height="16"
          rx="2"
          transform="matrix(-1 0 0 1 104 44)"
          fill="#111110"
        />
        <circle
          cx="2"
          cy="2"
          r="2"
          transform="matrix(-1 0 0 1 98 48)"
          fill="#6F6D66"
        />
        <rect
          width="16"
          height="16"
          rx="2"
          transform="matrix(-1 0 0 1 104 61)"
          fill="#111110"
        />
        <circle
          cx="2"
          cy="2"
          r="2"
          transform="matrix(-1 0 0 1 98 65)"
          fill="#6F6D66"
        />
        <rect
          width="16"
          height="26"
          rx="2"
          transform="matrix(-0.866025 -0.5 -0.5 0.866025 125 95)"
          fill="#111110"
        />
        <circle
          cx="2"
          cy="2"
          r="2"
          transform="matrix(-0.866025 -0.5 -0.5 0.866025 115.804 98.9282)"
          fill="#6F6D66"
        />
        <rect
          width="16"
          height="16"
          rx="2"
          transform="matrix(-0.866025 -0.5 -0.5 0.866025 110 86)"
          fill="#111110"
        />
        <circle
          cx="2"
          cy="2"
          r="2"
          transform="matrix(-0.866025 -0.5 -0.5 0.866025 102.804 86.4641)"
          fill="#6F6D66"
        />
      </svg>
    ),
  },
  // {
  //   title: 'Keychron Q2 Pro',
  //   description: 'Compact and customizable mechanical keyboard.',
  //   link: 'https://amzn.to/4clpFw4',
  //   category: Category.HardwareAndPeripherals,
  //   graphic: '⌨️',
  // },
  // {
  //   title: 'Logitech MX Master 3',
  //   description: 'Ergonomic wireless mouse with customizable buttons.',
  //   link: 'https://amzn.to/3L2EXda',
  //   category: Category.HardwareAndPeripherals,
  //   graphic: '🖱',
  // },
  {
    title: 'CalDigit TS4',
    description:
      'This Thunderbolt dock transforms any laptop into a full-fledged workstation, connecting multiple displays and peripherals with a single cable for a streamlined setup.',
    link: 'https://amzn.to/3XHYTcd',
    category: Category.HardwareAndPeripherals,
    graphic: '🔌',
    icon: () => (
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 216 72"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          padding: '25px',
        }}
      >
        <rect
          x="2"
          y="2"
          width="212"
          height="68"
          rx="2"
          fill="#8D8D86"
          stroke="#63635E"
          strokeWidth="4"
        />
        <mask id="path-2-inside-1_28_93" fill="white">
          <rect x="176" y="19" width="26" height="10" rx="1" />
        </mask>
        <rect
          x="176"
          y="19"
          width="26"
          height="10"
          rx="1"
          fill="#21201C"
          stroke="#63635E"
          strokeWidth="4"
          mask="url(#path-2-inside-1_28_93)"
        />
        <rect
          x="153"
          y="47"
          width="16"
          height="6"
          rx="3"
          fill="#21201C"
          stroke="#63635E"
          strokeWidth="2"
        />
        <rect
          x="181"
          y="47"
          width="16"
          height="6"
          rx="3"
          fill="#21201C"
          stroke="#63635E"
          strokeWidth="2"
        />
        <circle
          cx="161"
          cy="24"
          r="5"
          fill="#21201C"
          stroke="#63635E"
          strokeWidth="2"
        />
        <rect
          x="95"
          y="29"
          width="27"
          height="3"
          rx="1.5"
          fill="#21201C"
          stroke="#63635E"
        />
        <rect
          x="81"
          y="36"
          width="55"
          height="6"
          rx="3"
          fill="#21201C"
          stroke="#63635E"
          strokeWidth="2"
        />
        <rect
          x="13"
          y="14"
          width="11"
          height="45"
          rx="2"
          fill="#21201C"
          fillOpacity="0.15"
        />
        <circle cx="35" cy="36" r="2" fill="white" />
      </svg>
    ),
  },
  // {
  //   title: 'Herman Miller Aeron Chair',
  //   description: 'Ergonomic office chair with adjustable lumbar support.',
  //   link: 'https://amzn.to/4bqwueq',
  //   category: Category.DeskAndErgonomics,
  //   graphic: '🪑',
  // },
  // {
  //   title: 'Autonomous Desk Frame',
  //   description: 'Height-adjustable standing desk frame with memory presets.',
  //   link: 'https://www.autonomous.ai/standing-desks/autonomous-desk-diy?option_code=DiySmartDeskKit-FrameSmartDesk2_DeskFrame.Black,Model.Proframe',
  //   category: Category.DeskAndErgonomics,
  //   graphic: '⬆️⬇️',
  // },
  // {
  //   title: 'IKEA Karlby Countertop',
  //   description:
  //     'Sturdy and spacious desk surface made of wood (I prefer the walnut finish).',
  //   link: 'https://www.ikea.com/us/en/p/karlby-countertop-walnut-veneer-70335212/',
  //   category: Category.DeskAndErgonomics,
  //   graphic: '🪵',
  // },
  {
    title: 'BD DT 900 Pro X',
    description:
      'These open-back headphones deliver crystal-clear sound for precise audio work and immersive music breaks, keeping me focused and inspired throughout my day.',
    link: 'https://amzn.to/3W1fkQm',
    category: Category.HardwareAndPeripherals,
    graphic: '🎵',
    icon: () => (
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 110 127"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M29 67.4974C29 66.9196 29.0055 66.8476 29.0113 66.8098C29.0661 66.4474 29.3148 66.1441 29.6593 66.0192L28.978 64.1389L29.6593 66.0192C29.6953 66.0062 29.7649 65.9866 30.3315 65.8733C32.0563 65.5283 32.862 65.3676 33.6631 65.2431C37.5311 64.6418 41.4689 64.6418 45.3369 65.2431C46.138 65.3676 46.9437 65.5283 48.6685 65.8733C49.2351 65.9866 49.3047 66.0062 49.3407 66.0192C49.6852 66.1441 49.9339 66.4474 49.9887 66.8097C49.9945 66.8476 50 66.9196 50 67.4974V121.503C50 122.08 49.9945 122.152 49.9887 122.19C49.9339 122.553 49.6852 122.856 49.3407 122.981C49.3047 122.994 49.2351 123.013 48.6685 123.127C46.9437 123.472 46.138 123.632 45.3369 123.757C41.4689 124.358 37.5311 124.358 33.6631 123.757C32.862 123.632 32.0563 123.472 30.3315 123.127C29.7649 123.013 29.6953 122.994 29.6593 122.981C29.3148 122.856 29.0661 122.553 29.0113 122.19C29.0055 122.152 29 122.08 29 121.503V67.4974Z"
          fill="#8D8D86"
          stroke="#63635E"
          stroke-width="4"
        />
        <path
          d="M6.96656 74.2659C7.21626 72.6049 8.47712 71.2768 10.123 70.9412L27 67.5V121.5L10.0476 117.611C8.44059 117.243 7.22439 115.926 6.9845 114.295L5.29803 102.827C4.43741 96.9744 4.44692 91.027 5.32625 85.1776L6.96656 74.2659Z"
          fill="#21201C"
        />
        <path
          d="M81 67.4974C81 66.9196 80.9945 66.8476 80.9887 66.8098C80.9339 66.4474 80.6852 66.1441 80.3407 66.0192L81.022 64.1389L80.3407 66.0192C80.3047 66.0062 80.2351 65.9866 79.6685 65.8733C77.9437 65.5283 77.138 65.3676 76.3369 65.2431C72.4689 64.6418 68.5311 64.6418 64.6631 65.2431C63.862 65.3676 63.0563 65.5283 61.3315 65.8733C60.7649 65.9866 60.6953 66.0062 60.6593 66.0192C60.3148 66.1441 60.0661 66.4474 60.0113 66.8097C60.0055 66.8476 60 66.9196 60 67.4974V121.503C60 122.08 60.0055 122.152 60.0113 122.19C60.0661 122.553 60.3148 122.856 60.6593 122.981C60.6953 122.994 60.7649 123.013 61.3315 123.127C63.0563 123.472 63.862 123.632 64.6631 123.757C68.5311 124.358 72.4689 124.358 76.3369 123.757C77.138 123.632 77.9437 123.472 79.6685 123.127C80.2351 123.013 80.3047 122.994 80.3407 122.981C80.6852 122.856 80.9339 122.553 80.9887 122.19C80.9945 122.152 81 122.08 81 121.503V67.4974Z"
          fill="#8D8D86"
          stroke="#63635E"
          stroke-width="4"
        />
        <path
          d="M103.033 74.2659C102.784 72.6049 101.523 71.2768 99.877 70.9412L83 67.5V121.5L99.9524 117.611C101.559 117.243 102.776 115.926 103.015 114.295L104.702 102.827C105.563 96.9744 105.553 91.027 104.674 85.1776L103.033 74.2659Z"
          fill="#21201C"
        />
        <line
          x1="5.93073"
          y1="53.4782"
          x2="15.9307"
          y2="90.4782"
          stroke="#63635E"
          stroke-width="4"
        />
        <line
          x1="103.927"
          y1="54.5353"
          x2="93.927"
          y2="90.5353"
          stroke="#63635E"
          stroke-width="4"
        />
        <path
          d="M105.105 55C106.771 55 107.604 55 108.273 54.6369C108.83 54.3348 109.34 53.7791 109.593 53.1983C109.897 52.5003 109.831 51.7344 109.699 50.2025C107.268 22.0733 83.6642 0 54.9049 0C26.1456 0 2.54189 22.0733 0.111237 50.2025C-0.0211328 51.7344 -0.0873178 52.5003 0.216809 53.1983C0.469867 53.7791 0.979602 54.3348 1.53646 54.6369C2.2057 55 3.03877 55 4.70489 55H6.10489C7.7818 55 8.62026 55 9.22593 54.7157C9.79943 54.4465 10.1844 54.101 10.5138 53.5598C10.8617 52.9883 10.9621 52.0614 11.1629 50.2076C13.5509 28.1614 32.2238 11 54.9049 11C77.586 11 96.2589 28.1614 98.6469 50.2076C98.8477 52.0614 98.9481 52.9883 99.296 53.5598C99.6254 54.101 100.01 54.4465 100.584 54.7157C101.19 55 102.028 55 103.705 55H105.105Z"
          fill="#21201C"
        />
        <path
          d="M90.9999 30C80.5 34 79.8005 17 55.4999 17C31.1994 17 28.5 34 18.9999 30.0001C18.0783 29.612 31.1994 10.5 55.4999 10.5C79.8005 10.5 91.9344 29.644 90.9999 30Z"
          fill="#63635E"
        />
        <circle
          cx="17"
          cy="92"
          r="4"
          fill="#21201C"
          stroke="#82827C"
          stroke-width="4"
        />
        <circle
          cx="93"
          cy="92"
          r="4"
          fill="#21201C"
          stroke="#82827C"
          stroke-width="4"
        />
      </svg>
    ),
  },
  // {
  //   title: 'AirPods Pro',
  //   description: 'Wireless earbuds with active noise cancellation.',
  //   link: 'https://amzn.to/3zmNR2E',
  //   category: Category.HardwareAndPeripherals,
  //   graphic: '🎶',
  // },
  {
    title: 'Shure MV7',
    description:
      'This versatile microphone delivers podcast-quality audio for client calls and team meetings, ensuring my ideas come across crystal clear.',
    link: 'https://amzn.to/3zmNR2E',
    category: Category.HardwareAndPeripherals,
    graphic: '🎤',
    icon: () => (
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 122 133"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M21.4497 11.0992C25.9461 6.60278 33.1693 6.39453 37.9173 10.6244L68.3388 37.7262L37.2261 68.8389L10.1243 38.4174C5.8944 33.6694 6.10266 26.4462 10.5991 21.9498L21.4497 11.0992Z"
          fill="#111110"
        />
        <rect
          x="70.4601"
          y="38.4333"
          width="22"
          height="46"
          rx="2"
          transform="rotate(45 70.4601 38.4333)"
          fill="#3B3A37"
          stroke="#21201C"
          stroke-width="4"
        />
        <path
          d="M55.6653 84.3408L83.8408 56.1653L113.253 87.8843C115.446 90.2495 115.377 93.9257 113.096 96.2065L95.7065 113.596C93.4257 115.877 89.7496 115.946 87.3843 113.753L55.6653 84.3408Z"
          fill="#3B3A37"
          stroke="#21201C"
          stroke-width="4"
        />
        <path
          d="M70 118C70 120.209 68.2091 122 66 122H58C55.7909 122 54 120.209 54 118V62H54.0175C54.2919 58.0911 57.7609 55 62 55C66.2391 55 69.7081 58.0911 69.9825 62H70V118Z"
          fill="#21201C"
        />
        <rect x="58" y="122" width="8" height="6" fill="#21201C" />
        <rect x="54" y="128" width="16" height="5" rx="1" fill="#21201C" />
        <circle cx="62" cy="62" r="4" fill="#3B3A37" />
      </svg>
    ),
  },
  // {
  //   title: 'Elgato Mic Arm',
  //   description: 'Adjustable microphone arm with built-in cable management.',
  //   link: 'https://www.elgato.com/en/gaming/multi-mount',
  //   category: Category.HardwareAndPeripherals,
  //   graphic: '🎙',
  // },
  // {
  //   title: 'Ergotron LX Monitor Arm',
  //   description: 'Adjustable monitor arm for improved ergonomics.',
  //   link: '',
  //   category: Category.HardwareAndPeripherals,
  //   graphic: '🖥',
  // },
  // {
  //   title: 'Visual Studio Code',
  //   description: 'Code editor with a rich extension ecosystem.',
  //   link: 'https://code.visualstudio.com/',
  //   category: Category.Software,
  //   graphic: '🧰',
  // },
  // {
  //   title: 'CleanShot X',
  //   description: 'Screen capture and recording tool for macOS.',
  //   link: 'https://cleanshot.com/',
  //   category: Category.Software,
  //   graphic: '📸',
  // },
  // {
  //   title: 'Raycast',
  //   description: 'Productivity tool for macOS with custom workflows.',
  //   link: 'https://www.raycast.com/',
  //   category: Category.Software,
  //   graphic: '🚀',
  // },
]

export { things }
