// Mock vehicle data - static copy from API for development
export const mockVehicles = [
  {
    vin: "WBS2U7C00L7E83224",
    year: 2024,
    make: "Porsche",
    model: "911",
    trim: "Carrera",
    color: "Midnight Black",
    transmission: "PDK",
    condition: "New",
    price: 119500,
    mileage: 45,
    daysOnMarket: 12,
    dealerName: "Porsche Salt Lake City",
    url: "https://marketcheck.com/listings/porsche-911-2024-1"
  },
  {
    vin: "WBS2U7C5XK7D14712",
    year: 2023,
    make: "Porsche",
    model: "911",
    trim: "Carrera T",
    color: "Guards Red",
    transmission: "Manual",
    condition: "New",
    price: 125000,
    mileage: 120,
    daysOnMarket: 8,
    dealerName: "Porsche Lehi",
    url: "https://marketcheck.com/listings/porsche-911-2023-2"
  },
  {
    vin: "WBS1J5C57JVA12703",
    year: 2023,
    make: "Porsche",
    model: "911",
    trim: "Carrera S",
    color: "Agate Gray Metallic",
    transmission: "PDK",
    condition: "Used",
    price: 98500,
    mileage: 18500,
    daysOnMarket: 24,
    dealerName: "Park City Motors",
    url: "https://marketcheck.com/listings/porsche-911-2023-3"
  },
  {
    vin: "3MF13DM04R8E71744",
    year: 2022,
    make: "Porsche",
    model: "911",
    trim: "GTS",
    color: "Carmine Red",
    transmission: "PDK",
    condition: "Used",
    price: 102300,
    mileage: 28000,
    daysOnMarket: 19,
    dealerName: "Salt Lake City Automotive",
    url: "https://marketcheck.com/listings/porsche-911-2022-4"
  },
  {
    vin: "WBS1H9C58HV886777",
    year: 2024,
    make: "Porsche",
    model: "911",
    trim: "Turbo",
    color: "White",
    transmission: "PDK",
    condition: "New",
    price: 189900,
    mileage: 15,
    daysOnMarket: 5,
    dealerName: "Porsche Salt Lake City",
    url: "https://marketcheck.com/listings/porsche-911-2024-5"
  },
  {
    vin: "WBS2U7C00M7H27827",
    year: 2023,
    make: "Porsche",
    model: "911",
    trim: "Carrera",
    color: "Black",
    transmission: "PDK",
    condition: "Certified",
    price: 105000,
    mileage: 12500,
    daysOnMarket: 31,
    dealerName: "Porsche Lehi",
    url: "https://marketcheck.com/listings/porsche-911-2023-6"
  },
  {
    vin: "WBS1J3C03L7H38526",
    year: 2022,
    make: "Porsche",
    model: "911",
    trim: "Carrera 4",
    color: "Silver",
    transmission: "PDK",
    condition: "Used",
    price: 94500,
    mileage: 35000,
    daysOnMarket: 42,
    dealerName: "Salt Lake City Automotive",
    url: "https://marketcheck.com/listings/porsche-911-2022-7"
  },
  {
    vin: "3MF23DM02S8F58035",
    year: 2021,
    make: "Porsche",
    model: "911",
    trim: "Carrera S",
    color: "Miami Blue",
    transmission: "PDK",
    condition: "Used",
    price: 89000,
    mileage: 42000,
    daysOnMarket: 35,
    dealerName: "Park City Motors",
    url: "https://marketcheck.com/listings/porsche-911-2021-8"
  },
  {
    vin: "WBS1H9C5XHV886666",
    year: 2023,
    make: "Porsche",
    model: "911",
    trim: "Turbo S",
    color: "Jet Black",
    transmission: "PDK",
    condition: "New",
    price: 205000,
    mileage: 8,
    daysOnMarket: 3,
    dealerName: "Porsche Salt Lake City",
    url: "https://marketcheck.com/listings/porsche-911-2023-9"
  },
  {
    vin: "WBS2U7C08L7F03140",
    year: 2022,
    make: "Porsche",
    model: "911",
    trim: "Carrera GTS",
    color: "Abyss Blue",
    transmission: "PDK",
    condition: "Used",
    price: 112500,
    mileage: 22000,
    daysOnMarket: 28,
    dealerName: "Porsche Lehi",
    url: "https://marketcheck.com/listings/porsche-911-2022-10"
  }
];

// Mock price history data
export const mockPriceHistory = {
  "WBS2U7C00L7E83224": {
    vin: "WBS2U7C00L7E83224",
    priceHistory: [
      { price: 119500, date: "2026-03-10", seller: "Porsche Salt Lake City" },
      { price: 119500, date: "2026-03-15", seller: "Porsche Salt Lake City" },
      { price: 119500, date: "2026-03-20", seller: "Porsche Salt Lake City" },
      { price: 119500, date: "2026-03-23", seller: "Porsche Salt Lake City" }
    ],
    currentPrice: 119500,
    startPrice: 119500,
    priceChange: 0,
    entries: 4
  },
  "WBS2U7C5XK7D14712": {
    vin: "WBS2U7C5XK7D14712",
    priceHistory: [
      { price: 127500, date: "2026-03-05", seller: "Porsche Lehi" },
      { price: 126000, date: "2026-03-12", seller: "Porsche Lehi" },
      { price: 125500, date: "2026-03-18", seller: "Porsche Lehi" },
      { price: 125000, date: "2026-03-23", seller: "Porsche Lehi" }
    ],
    currentPrice: 125000,
    startPrice: 127500,
    priceChange: -2500,
    entries: 4
  },
  "WBS1J5C57JVA12703": {
    vin: "WBS1J5C57JVA12703",
    priceHistory: [
      { price: 101000, date: "2026-02-28", seller: "Park City Motors" },
      { price: 100000, date: "2026-03-10", seller: "Park City Motors" },
      { price: 99000, date: "2026-03-18", seller: "Park City Motors" },
      { price: 98500, date: "2026-03-23", seller: "Park City Motors" }
    ],
    currentPrice: 98500,
    startPrice: 101000,
    priceChange: -2500,
    entries: 4
  },
  "3MF13DM04R8E71744": {
    vin: "3MF13DM04R8E71744",
    priceHistory: [
      { price: 104500, date: "2026-03-08", seller: "Salt Lake City Automotive" },
      { price: 103500, date: "2026-03-15", seller: "Salt Lake City Automotive" },
      { price: 102800, date: "2026-03-20", seller: "Salt Lake City Automotive" },
      { price: 102300, date: "2026-03-23", seller: "Salt Lake City Automotive" }
    ],
    currentPrice: 102300,
    startPrice: 104500,
    priceChange: -2200,
    entries: 4
  }
};
