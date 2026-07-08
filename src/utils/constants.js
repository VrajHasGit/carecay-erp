export const MAKES = [
  'Maruti Suzuki', 'Hyundai', 'Tata', 'Honda', 'Toyota', 'Mahindra', 'Kia',
  'MG', 'Skoda', 'Volkswagen', 'Renault', 'Nissan', 'Ford', 'Chevrolet',
  'Jeep', 'Fiat', 'Mitsubishi', 'Datsun', 'BMW', 'Mercedes-Benz', 'Audi',
  'Volvo', 'Jaguar', 'Land Rover', 'Other'
];

export const MODELS = {
  'Maruti Suzuki': ['Swift', 'Baleno', 'Alto', 'Alto K10', 'Wagon R', 'Ertiga', 'Brezza', 'Dzire', 'Celerio', 'Ignis', 'S-Cross', 'Ciaz', 'XL6', 'Grand Vitara', 'Fronx', 'Jimny', 'Invicto', 'Eeco'],
  'Hyundai': ['i20', 'i10', 'Creta', 'Venue', 'Verna', 'Aura', 'Santro', 'Tucson', 'Alcazar', 'Exter', 'Ioniq 5', 'Kona Electric'],
  'Tata': ['Nexon', 'Harrier', 'Safari', 'Punch', 'Tiago', 'Tigor', 'Altroz', 'Hexa', 'Nexon EV', 'Tiago EV', 'Tigor EV', 'Punch EV', 'Curvv', 'Curvv EV'],
  'Honda': ['City', 'Amaze', 'WR-V', 'Jazz', 'HR-V', 'Elevate', 'Civic', 'CR-V'],
  'Toyota': ['Innova', 'Innova Crysta', 'Innova Hycross', 'Fortuner', 'Fortuner Legender', 'Glanza', 'Urban Cruiser', 'Camry', 'Vellfire', 'Hyryder', 'Hilux', 'Rumion', 'Taisor'],
  'Mahindra': ['XUV700', 'XUV300', 'XUV400 EV', 'Thar', 'Thar Roxx', 'Scorpio', 'Scorpio-N', 'Bolero', 'Bolero Neo', 'BE6E', 'XEV 9e', 'Marazzo', 'XUV500', 'TUV300', 'KUV100'],
  'Kia': ['Seltos', 'Sonet', 'Carnival', 'Carens', 'EV6', 'EV9'],
  'MG': ['Hector', 'Hector Plus', 'Astor', 'Gloster', 'ZS EV', 'Comet EV', 'Windsor EV'],
  'Skoda': ['Kushaq', 'Slavia', 'Kodiaq', 'Superb', 'Octavia', 'Rapid', 'Kylaq'],
  'Volkswagen': ['Taigun', 'Virtus', 'Tiguan', 'Polo', 'Vento', 'Ameo', 'Jetta'],
  'Renault': ['Kwid', 'Kiger', 'Triber', 'Duster', 'Captur'],
  'Nissan': ['Magnite', 'Kicks', 'Micra', 'Sunny', 'Terrano', 'X-Trail'],
  'Ford': ['EcoSport', 'Endeavour', 'Figo', 'Aspire', 'Freestyle'],
  'Chevrolet': ['Beat', 'Cruze', 'Spark', 'Tavera', 'Enjoy', 'Sail'],
  'Jeep': ['Compass', 'Meridian', 'Wrangler', 'Grand Cherokee'],
};

export const YEARS = Array.from({ length: 2026 - 2000 + 1 }, (_, i) => String(2026 - i));
export const CITIES = ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Gandhinagar', 'Bhavnagar', 'Jamnagar', 'Junagadh', 'Anand', 'Nadiad', 'Mehsana', 'Other'];
export const FUELS = ['Petrol', 'Diesel', 'CNG', 'Electric', 'Hybrid', 'Petrol+CNG'];
export const TRANS = ['Manual', 'Automatic', 'AMT', 'CVT', 'DCT'];
export const OWNERS = ['1st', '2nd', '3rd', '4th+'];
export const COLORS = ['White', 'Silver', 'Grey', 'Black', 'Red', 'Blue', 'Brown', 'Orange', 'Yellow', 'Green', 'Other'];
