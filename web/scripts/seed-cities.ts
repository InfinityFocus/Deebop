import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CityData {
  name: string;
  countryCode: string;
  countryName: string;
  population?: number;
}

// Top cities worldwide - focusing on major metropolitan areas
const cities: CityData[] = [
  // United Kingdom
  { name: 'London', countryCode: 'GB', countryName: 'United Kingdom', population: 8982000 },
  { name: 'Birmingham', countryCode: 'GB', countryName: 'United Kingdom', population: 1149000 },
  { name: 'Manchester', countryCode: 'GB', countryName: 'United Kingdom', population: 553230 },
  { name: 'Liverpool', countryCode: 'GB', countryName: 'United Kingdom', population: 498042 },
  { name: 'Bristol', countryCode: 'GB', countryName: 'United Kingdom', population: 463400 },
  { name: 'Edinburgh', countryCode: 'GB', countryName: 'United Kingdom', population: 524930 },
  { name: 'Glasgow', countryCode: 'GB', countryName: 'United Kingdom', population: 633120 },
  { name: 'Leeds', countryCode: 'GB', countryName: 'United Kingdom', population: 793139 },
  { name: 'Sheffield', countryCode: 'GB', countryName: 'United Kingdom', population: 584853 },
  { name: 'Cardiff', countryCode: 'GB', countryName: 'United Kingdom', population: 362756 },
  { name: 'Belfast', countryCode: 'GB', countryName: 'United Kingdom', population: 343542 },
  { name: 'Newcastle', countryCode: 'GB', countryName: 'United Kingdom', population: 302820 },
  { name: 'Nottingham', countryCode: 'GB', countryName: 'United Kingdom', population: 321500 },
  { name: 'Brighton', countryCode: 'GB', countryName: 'United Kingdom', population: 290885 },
  { name: 'Cambridge', countryCode: 'GB', countryName: 'United Kingdom', population: 145700 },
  { name: 'Oxford', countryCode: 'GB', countryName: 'United Kingdom', population: 152450 },

  // United States
  { name: 'New York', countryCode: 'US', countryName: 'United States', population: 8336817 },
  { name: 'Los Angeles', countryCode: 'US', countryName: 'United States', population: 3979576 },
  { name: 'Chicago', countryCode: 'US', countryName: 'United States', population: 2693976 },
  { name: 'Houston', countryCode: 'US', countryName: 'United States', population: 2320268 },
  { name: 'Phoenix', countryCode: 'US', countryName: 'United States', population: 1680992 },
  { name: 'Philadelphia', countryCode: 'US', countryName: 'United States', population: 1584064 },
  { name: 'San Antonio', countryCode: 'US', countryName: 'United States', population: 1547253 },
  { name: 'San Diego', countryCode: 'US', countryName: 'United States', population: 1423851 },
  { name: 'Dallas', countryCode: 'US', countryName: 'United States', population: 1343573 },
  { name: 'San Francisco', countryCode: 'US', countryName: 'United States', population: 873965 },
  { name: 'Austin', countryCode: 'US', countryName: 'United States', population: 978908 },
  { name: 'Seattle', countryCode: 'US', countryName: 'United States', population: 737015 },
  { name: 'Denver', countryCode: 'US', countryName: 'United States', population: 727211 },
  { name: 'Boston', countryCode: 'US', countryName: 'United States', population: 692600 },
  { name: 'Las Vegas', countryCode: 'US', countryName: 'United States', population: 641903 },
  { name: 'Portland', countryCode: 'US', countryName: 'United States', population: 652503 },
  { name: 'Miami', countryCode: 'US', countryName: 'United States', population: 467963 },
  { name: 'Atlanta', countryCode: 'US', countryName: 'United States', population: 498715 },
  { name: 'Nashville', countryCode: 'US', countryName: 'United States', population: 689447 },
  { name: 'Detroit', countryCode: 'US', countryName: 'United States', population: 639111 },

  // Canada
  { name: 'Toronto', countryCode: 'CA', countryName: 'Canada', population: 2731571 },
  { name: 'Vancouver', countryCode: 'CA', countryName: 'Canada', population: 631486 },
  { name: 'Montreal', countryCode: 'CA', countryName: 'Canada', population: 1762949 },
  { name: 'Calgary', countryCode: 'CA', countryName: 'Canada', population: 1239220 },
  { name: 'Ottawa', countryCode: 'CA', countryName: 'Canada', population: 934243 },

  // Germany
  { name: 'Berlin', countryCode: 'DE', countryName: 'Germany', population: 3644826 },
  { name: 'Munich', countryCode: 'DE', countryName: 'Germany', population: 1471508 },
  { name: 'Hamburg', countryCode: 'DE', countryName: 'Germany', population: 1841179 },
  { name: 'Frankfurt', countryCode: 'DE', countryName: 'Germany', population: 753056 },
  { name: 'Cologne', countryCode: 'DE', countryName: 'Germany', population: 1085664 },

  // France
  { name: 'Paris', countryCode: 'FR', countryName: 'France', population: 2161000 },
  { name: 'Lyon', countryCode: 'FR', countryName: 'France', population: 513275 },
  { name: 'Marseille', countryCode: 'FR', countryName: 'France', population: 861635 },
  { name: 'Toulouse', countryCode: 'FR', countryName: 'France', population: 471941 },
  { name: 'Nice', countryCode: 'FR', countryName: 'France', population: 342522 },

  // Spain
  { name: 'Madrid', countryCode: 'ES', countryName: 'Spain', population: 3223334 },
  { name: 'Barcelona', countryCode: 'ES', countryName: 'Spain', population: 1620343 },
  { name: 'Valencia', countryCode: 'ES', countryName: 'Spain', population: 791413 },
  { name: 'Seville', countryCode: 'ES', countryName: 'Spain', population: 688711 },

  // Italy
  { name: 'Rome', countryCode: 'IT', countryName: 'Italy', population: 2872800 },
  { name: 'Milan', countryCode: 'IT', countryName: 'Italy', population: 1352000 },
  { name: 'Naples', countryCode: 'IT', countryName: 'Italy', population: 967069 },
  { name: 'Florence', countryCode: 'IT', countryName: 'Italy', population: 382258 },
  { name: 'Venice', countryCode: 'IT', countryName: 'Italy', population: 261905 },

  // Netherlands
  { name: 'Amsterdam', countryCode: 'NL', countryName: 'Netherlands', population: 872680 },
  { name: 'Rotterdam', countryCode: 'NL', countryName: 'Netherlands', population: 651446 },
  { name: 'The Hague', countryCode: 'NL', countryName: 'Netherlands', population: 537833 },

  // Belgium
  { name: 'Brussels', countryCode: 'BE', countryName: 'Belgium', population: 185103 },
  { name: 'Antwerp', countryCode: 'BE', countryName: 'Belgium', population: 523248 },

  // Nordic Countries
  { name: 'Stockholm', countryCode: 'SE', countryName: 'Sweden', population: 975904 },
  { name: 'Copenhagen', countryCode: 'DK', countryName: 'Denmark', population: 602481 },
  { name: 'Oslo', countryCode: 'NO', countryName: 'Norway', population: 693494 },
  { name: 'Helsinki', countryCode: 'FI', countryName: 'Finland', population: 656229 },
  { name: 'Reykjavik', countryCode: 'IS', countryName: 'Iceland', population: 131136 },

  // Eastern Europe
  { name: 'Warsaw', countryCode: 'PL', countryName: 'Poland', population: 1790658 },
  { name: 'Prague', countryCode: 'CZ', countryName: 'Czech Republic', population: 1309000 },
  { name: 'Budapest', countryCode: 'HU', countryName: 'Hungary', population: 1752286 },
  { name: 'Vienna', countryCode: 'AT', countryName: 'Austria', population: 1897491 },
  { name: 'Zurich', countryCode: 'CH', countryName: 'Switzerland', population: 415367 },
  { name: 'Lisbon', countryCode: 'PT', countryName: 'Portugal', population: 544851 },
  { name: 'Dublin', countryCode: 'IE', countryName: 'Ireland', population: 544107 },
  { name: 'Athens', countryCode: 'GR', countryName: 'Greece', population: 664046 },
  { name: 'Bucharest', countryCode: 'RO', countryName: 'Romania', population: 1883425 },

  // Russia & CIS
  { name: 'Moscow', countryCode: 'RU', countryName: 'Russia', population: 12615882 },
  { name: 'Saint Petersburg', countryCode: 'RU', countryName: 'Russia', population: 5383890 },
  { name: 'Kyiv', countryCode: 'UA', countryName: 'Ukraine', population: 2962180 },

  // Asia - China
  { name: 'Shanghai', countryCode: 'CN', countryName: 'China', population: 27058480 },
  { name: 'Beijing', countryCode: 'CN', countryName: 'China', population: 21516000 },
  { name: 'Shenzhen', countryCode: 'CN', countryName: 'China', population: 12528300 },
  { name: 'Guangzhou', countryCode: 'CN', countryName: 'China', population: 14904400 },
  { name: 'Hong Kong', countryCode: 'HK', countryName: 'Hong Kong', population: 7481800 },

  // Asia - Japan
  { name: 'Tokyo', countryCode: 'JP', countryName: 'Japan', population: 13960000 },
  { name: 'Osaka', countryCode: 'JP', countryName: 'Japan', population: 2752412 },
  { name: 'Kyoto', countryCode: 'JP', countryName: 'Japan', population: 1475183 },

  // Asia - South Korea
  { name: 'Seoul', countryCode: 'KR', countryName: 'South Korea', population: 9736027 },
  { name: 'Busan', countryCode: 'KR', countryName: 'South Korea', population: 3429529 },

  // Asia - Southeast
  { name: 'Singapore', countryCode: 'SG', countryName: 'Singapore', population: 5685807 },
  { name: 'Bangkok', countryCode: 'TH', countryName: 'Thailand', population: 10539415 },
  { name: 'Kuala Lumpur', countryCode: 'MY', countryName: 'Malaysia', population: 1982112 },
  { name: 'Ho Chi Minh City', countryCode: 'VN', countryName: 'Vietnam', population: 8993082 },
  { name: 'Jakarta', countryCode: 'ID', countryName: 'Indonesia', population: 10562088 },
  { name: 'Manila', countryCode: 'PH', countryName: 'Philippines', population: 1846513 },

  // Asia - South
  { name: 'Mumbai', countryCode: 'IN', countryName: 'India', population: 12478447 },
  { name: 'Delhi', countryCode: 'IN', countryName: 'India', population: 11007835 },
  { name: 'Bangalore', countryCode: 'IN', countryName: 'India', population: 8443675 },
  { name: 'Chennai', countryCode: 'IN', countryName: 'India', population: 4646732 },
  { name: 'Kolkata', countryCode: 'IN', countryName: 'India', population: 4496694 },

  // Middle East
  { name: 'Dubai', countryCode: 'AE', countryName: 'United Arab Emirates', population: 3137000 },
  { name: 'Abu Dhabi', countryCode: 'AE', countryName: 'United Arab Emirates', population: 1483000 },
  { name: 'Tel Aviv', countryCode: 'IL', countryName: 'Israel', population: 460613 },
  { name: 'Istanbul', countryCode: 'TR', countryName: 'Turkey', population: 15462452 },
  { name: 'Ankara', countryCode: 'TR', countryName: 'Turkey', population: 5639076 },
  { name: 'Riyadh', countryCode: 'SA', countryName: 'Saudi Arabia', population: 7676654 },
  { name: 'Doha', countryCode: 'QA', countryName: 'Qatar', population: 1186023 },

  // Africa
  { name: 'Cairo', countryCode: 'EG', countryName: 'Egypt', population: 9540000 },
  { name: 'Lagos', countryCode: 'NG', countryName: 'Nigeria', population: 14862111 },
  { name: 'Cape Town', countryCode: 'ZA', countryName: 'South Africa', population: 433688 },
  { name: 'Johannesburg', countryCode: 'ZA', countryName: 'South Africa', population: 5635127 },
  { name: 'Nairobi', countryCode: 'KE', countryName: 'Kenya', population: 4397073 },
  { name: 'Accra', countryCode: 'GH', countryName: 'Ghana', population: 2514000 },
  { name: 'Casablanca', countryCode: 'MA', countryName: 'Morocco', population: 3359818 },

  // Australia & New Zealand
  { name: 'Sydney', countryCode: 'AU', countryName: 'Australia', population: 5312163 },
  { name: 'Melbourne', countryCode: 'AU', countryName: 'Australia', population: 5078193 },
  { name: 'Brisbane', countryCode: 'AU', countryName: 'Australia', population: 2514184 },
  { name: 'Perth', countryCode: 'AU', countryName: 'Australia', population: 2085973 },
  { name: 'Auckland', countryCode: 'NZ', countryName: 'New Zealand', population: 1463000 },
  { name: 'Wellington', countryCode: 'NZ', countryName: 'New Zealand', population: 215400 },

  // South America
  { name: 'São Paulo', countryCode: 'BR', countryName: 'Brazil', population: 12325232 },
  { name: 'Rio de Janeiro', countryCode: 'BR', countryName: 'Brazil', population: 6748000 },
  { name: 'Buenos Aires', countryCode: 'AR', countryName: 'Argentina', population: 3075646 },
  { name: 'Lima', countryCode: 'PE', countryName: 'Peru', population: 9674755 },
  { name: 'Bogotá', countryCode: 'CO', countryName: 'Colombia', population: 7181469 },
  { name: 'Santiago', countryCode: 'CL', countryName: 'Chile', population: 6257516 },
  { name: 'Mexico City', countryCode: 'MX', countryName: 'Mexico', population: 8918653 },
  { name: 'Guadalajara', countryCode: 'MX', countryName: 'Mexico', population: 1495182 },
];

async function main() {
  console.log('Seeding cities...');

  for (const city of cities) {
    await prisma.city.upsert({
      where: {
        name_countryCode: {
          name: city.name,
          countryCode: city.countryCode,
        },
      },
      update: {
        population: city.population,
      },
      create: {
        name: city.name,
        countryCode: city.countryCode,
        countryName: city.countryName,
        population: city.population,
      },
    });
  }

  const count = await prisma.city.count();
  console.log(`Seeded ${count} cities.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
