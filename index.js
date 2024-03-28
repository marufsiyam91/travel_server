const express = require('express');
const fs = require('fs'); // For file system access (reading JSON)
const cors = require('cors'); // For enabling CORS

const app = express();
const port = process.env.PORT || 3000;

app.use(cors()); // Enable CORS for all origins (adjust for specific origins if needed)
app.use(express.json()); // Parse incoming JSON data

// Load your JSON data (replace 'data.json' with your file name)
try {
  const data = JSON.parse(fs.readFileSync('data.json', 'utf8'));
  app.locals.data = data; // Store data in app locals for easier access
} catch (err) {
  console.error('Error reading data file:', err);
  process.exit(1); // Exit with error code in case of file read failure
}

// Function to filter tours based on query parameters
function filterTours(data, query) {
  let filteredTours = data;

  // Filter by country (optional, adjust based on your data structure)
  if (query.country) {
    filteredTours = filteredTours.filter(tour => tour.country.toLowerCase().includes(query.country.toLowerCase()));
  }

  if (query.region) {
    filteredTours = filteredTours.filter(tour => tour.region.toLowerCase().includes(query.region.toLowerCase()));
  }

  // Filter by price range (optional, adjust based on your data structure)
  if (query.minPrice && query.maxPrice) {
    filteredTours = filteredTours.filter(tour => tour.price >= query.minPrice && tour.price <= query.maxPrice);
  }

  // Add more filtering logic as needed based on your data properties

  return filteredTours;
}

// Function to sort tours based on query parameter
function sortTours(tours, sortBy) {
  if (!sortBy) return tours;

  const [sortField, sortOrder] = sortBy.split(','); // Split sort parameter (e.g., "price,asc" or "rating,desc")

  return tours.sort((a, b) => {
    let comparison = 0;
    if (a[sortField] < b[sortField]) {
      comparison = -1;
    } else if (a[sortField] > b[sortField]) {
      comparison = 1;
    }
    return sortOrder === 'desc' ? -comparison : comparison;
  });
}

// Function to paginate tours
function paginateTours(tours, page = 1, pageSize = 6) {
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  return tours.slice(startIndex, endIndex);
}

// GET request handler for all tours (with optional filtering, sorting, and pagination)
app.get('/tours', (req, res) => {
  const query = req.query; // Access query parameters
  const page = parseInt(query.page) || 1; // Default page to 1
  const pageSize = parseInt(query.pageSize) || 6; // Default page size to 10

  let filteredData = filterTours(app.locals.data, query);
  filteredData = sortTours(filteredData, query.sortBy);

  const paginatedData = paginateTours(filteredData, page, pageSize);
  const totalPages = Math.ceil(filteredData.length / pageSize);

  res.json({
    tours: paginatedData,
    totalPages,
  });
});

// GET request handler for a single tour by ID
app.get('/tours/:id', (req, res) => {
  const id = parseInt(req.params.id); // Ensure ID is an integer

  const foundTour = app.locals.data.find(tour => tour.id === id);

  if (foundTour) {
    res.json(foundTour);
  } else {
    res.status(404).send('Tour not found');
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});


