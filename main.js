let originalData; //read in once only from original CSV
let filteredData = []; //created global only so can share the results as CSV through Download Data button

// Function to fetch and parse the CSV file
async function fetchCSV() {
    
    const response = await fetch('cable_incidents.csv');
    const csvText = await response.text();
    const parsedData = Papa.parse(csvText, { header: true }).data;
    originalData = parsedData; // Store original data
    return parsedData;
}

// Function to populate filter options
function populateFilterOptions(data) {
    // Initialize filter dropdowns with a default option
    const filters = ['yearFilter', 'cableFilter', 'typeFilter', 'causeFilter', 'countryFilter', 'companyFilter'];
    filters.forEach(filterId => {
        const filterElement = document.getElementById(filterId);
        const sanitizedOption = DOMPurify.sanitize(`<option value="">${filterId.replace('Filter', '')}</option>`); // Sanitize the option string
        filterElement.innerHTML = sanitizedOption;
    });

    // Extract unique years for the yearFilter and sort them in descending order
    const uniqueYears = new Set();
    data.forEach(entry => {
        const year = entry.Date.split('/')[1]; // Extract the year part from the date string
        uniqueYears.add(year);
    });
    const sortedYears = Array.from(uniqueYears).sort((a, b) => b - a); // Sort in descending order

    // Populate the yearFilter dropdown with unique years
    const yearFilterElement = document.getElementById('yearFilter');
    sortedYears.forEach(year => {
        yearFilterElement.innerHTML += `<option value="${year}">${year}</option>`;
    });

    // Extract unique values for each filter
    const uniqueValues = {
        year: new Set(),
        cable: new Set(),
        type: new Set(),
        cause: new Set(),
        country: new Set(),
        company: new Set()
    };

    data.forEach(entry => {
        ['Date', 'Cable', 'Type', 'Cause', 'Country', 'Company'].forEach((key, index) => {
            entry[key].split(', ').forEach(value => {
                const trimmedValue = value.trim();
                if (trimmedValue !== '') {
                    uniqueValues[filters[index].replace('Filter', '')].add(trimmedValue);
                }
            });
        });
    });

    // Convert Sets to arrays and sort them alphabetically
    const sortedValues = {};
    Object.keys(uniqueValues).forEach(key => {
        sortedValues[key] = Array.from(uniqueValues[key]).sort();
    });

    // Populate dropdown options with sorted values, excluding the yearFilter
    filters.filter(filterId => filterId !== 'yearFilter').forEach(filterId => {
        const filterElement = document.getElementById(filterId);
        const values = sortedValues[filterId.replace('Filter', '')];
        values.forEach(value => {
            filterElement.innerHTML += `<option value="${value}">${value}</option>`;
        });
    });
}

function constructSearchUrl(activeSearchFilters) {
    const { searchQuery = '', filters = {} } = activeSearchFilters;
    let urlFragment = '?';

    Object.entries(filters).forEach(([key, value]) => {
        if (value) {
            urlFragment += `${encodeURIComponent(key)}=${encodeURIComponent(value)}&`;
        }
    });

    urlFragment += `search=${encodeURIComponent(searchQuery)}`;
    return urlFragment;
}

function manageAppState() {
    let activeSearchFilters = { searchQuery: '', filters: {} };
    let activeSortOrder = "newest";

    function updateSearchQuery(newSearchQuery) {
        activeSearchFilters.searchQuery = DOMPurify.sanitize(newSearchQuery);
        if (newSearchQuery.trim()!== '') {
            const urlFragment = constructSearchUrl(activeSearchFilters);
            history.pushState({}, '', urlFragment);
        }
    }

    function updateFilters(newFilters) {
        activeSearchFilters.filters = newFilters;
        const urlFragment = constructSearchUrl(activeSearchFilters);
        history.pushState({}, '', urlFragment);
    }

    function updateSortOrder(newSortOrder) {
        activeSortOrder = newSortOrder;
    }

    function applyFiltersAndSort() {
        generateFilteredBlogEntries();
        updateActiveFiltersDisplay(activeSearchFilters);
        updateURLWithSearchParameters(activeSearchFilters.searchQuery, activeSearchFilters.filters);
    }

    function getfilteredData(originalData, activeSearchFilters) {
        // Initialize the filtered data array
        //let filteredData = [];
        //commented out because it's now a global var

        // Retrieve current filter values
        const year = activeSearchFilters.filters.yearFilter;
        const cable = activeSearchFilters.filters.cableFilter;
        const type = activeSearchFilters.filters.typeFilter;
        const cause = activeSearchFilters.filters.causeFilter;
        const country = activeSearchFilters.filters.countryFilter;
        const company = activeSearchFilters.filters.companyFilter;

        // Filter the data based on the search query and other filters
        filteredData = originalData.filter(entry => {
            // Search query is only for Details column
            const searchQueryMatch = !activeSearchFilters.searchQuery || entry.Details.toLowerCase().includes(activeSearchFilters.searchQuery.toLowerCase());
            
            const entryYear = entry.Date.split('/')[1]; // Extract the year from the entry's date

            // Combine all matches
            return searchQueryMatch && 
                (!year || entryYear === year) &&
                (!cable || entry.Cable.split(', ').includes(cable)) &&
                (!type || entry.Type.split(', ').includes(type)) &&
                (!cause || entry.Cause.split(', ').includes(cause)) &&
                (!country || entry.Country.split(', ').includes(country)) &&
                (!company || entry.Company.split(', ').includes(company));

        }); 

        return filteredData;
    }

    // Function to filter blog entries - populates variable filteredData
    function generateFilteredBlogEntries() {
        clearContainer('blogContainer'); // Clear the blog container to remove existing entries
        
        // Use the getfilteredData function to get filteredData
        const filteredData = getfilteredData(originalData, activeSearchFilters);

        // After filtering, display the blog entries
        displayBlogEntries(filteredData, activeSearchFilters, activeSortOrder)
    }

    function displayBlogEntries(data, sortOrder) {
        const sortedData = sortData(data, activeSortOrder);

        sortedData.forEach(entry => {
            const [month, year] = entry.Date.split('/');
            const date = new Date(year, month - 1); // Note: months are 0-indexed in JavaScript
            const formattedDate = date.toLocaleString('default', { month: 'long', year: 'numeric' });

            // Create a Bootstrap card for each entry
            const card = document.createElement('div');
            card.className = 'card';
            //card.style.marginBottom = '10px';
            //card.style.padding = '15px';
            //card.style.border = '1px solid #000'; // Thin black border
            //card.style.borderRadius = '0.25rem'; // Rounded corners

            const cardBody = document.createElement('div');
            cardBody.className = 'card-body';

            const descriptionHtml = marked.parse(entry.Details);
            const cleanedDescriptionHtml = descriptionHtml.replace(/<\/?p>/g, '');
            // Sanitize the description
            const sanitizedDescriptionHtml = DOMPurify.sanitize(cleanedDescriptionHtml);

            // Sanitize the entire card body HTML string before insertion
            const sanitizedCardBodyHtml = DOMPurify.sanitize(`<p><b>${formattedDate}</b> - ${sanitizedDescriptionHtml}</p>`);
            cardBody.innerHTML = sanitizedCardBodyHtml;

            // Create sanitised badges for each tag
            const tags = ['Type', 'Cause'];
            tags.forEach(tag => {
                const tagValues = entry[tag].split(', ');
                tagValues.forEach(value => {
                    // Trim the value to remove any leading/trailing whitespace
                    const sanitizedValue = DOMPurify.sanitize(value.trim()); // Sanitize the value
                    
                    // Check if the (sanitised) trimmed value is not empty before creating and appending the badge
                    if (sanitizedValue!== '') {
                        const badge = document.createElement('span');
                        badge.className = 'hashtag';
                        badge.textContent = value.trim();
                        //badge.style.marginRight = '5px';
                        //badge.style.cursor = 'pointer';
                        badge.addEventListener('click', function() {                    
                            const filtersObj = {};
                            const filterId = `${tag.toLowerCase()}Filter`; // Construct the filter ID dynamically
                            filtersObj[filterId] = badge.textContent;
                            updateFilters(filtersObj); // Update activeSearchFilters.filters.<tag>Filter
                            updateSearchQuery(''); // Clear activeSearchFilters.searchQuery
                            applyFiltersAndSort();
                        });
                    
                        cardBody.appendChild(badge);
                    }
                });
            });

            card.appendChild(cardBody);
            document.getElementById('blogContainer').appendChild(card);
        });

        // Update the results count after generating the entries
        updateResultsCount();
    }

    // Function to reset UI activeSearchFilters and SortOrder
    function resetFilters() {

        updateSearchQuery('');
        document.getElementById('searchBox').value = ''; // Reset the search box value to be empty
        
        updateFilters({});
        document.getElementById('yearFilter').value = '';
        document.getElementById('cableFilter').value = '';
        document.getElementById('typeFilter').value = '';
        document.getElementById('causeFilter').value = '';
        document.getElementById('countryFilter').value = '';
        document.getElementById('companyFilter').value = '';

        updateSortOrder("newest");

        applyFiltersAndSort();

        //console.log("---all search filters cleared---");
    }

    async function initializePage() {
        await fetchCSV(); // Wait for the data to load
        populateFilterOptions(originalData);
        const { searchQuery, filters } = readURLForSearchParameters();
        activeSearchFilters = { searchQuery, filters };
        applyFiltersAndSort();

    }

    // Read URL for search parameters
    function readURLForSearchParameters() {
        const urlParams = new URLSearchParams(window.location.search);

        // Extract the search query from the URL
        const searchQuery = urlParams.get('search') || '';

        // Prepare an empty object to hold the filter values
        const filters = {};

        // Iterate over each key-value pair in the URL parameters
        for (const [key, value] of urlParams.entries()) {
            // Skip the 'search' parameter since we've already handled it
            if (key === 'search') continue;

            // Decode the key and value to handle encoded characters
            const decodedKey = decodeURIComponent(key);
            const decodedValue = decodeURIComponent(value);

            // Add the filter value to the filters object
            filters[decodedKey] = decodedValue;
        }

        // Return both the search query and the filters object
        return { searchQuery, filters };
    }

    // Helper function to update the URL with the current search parameters
    function updateURLWithSearchParameters(searchQuery, filters) {
        let urlFragment = '?';
        Object.entries(filters).forEach(([key, value]) => {
            if (value) {
                urlFragment += `${encodeURIComponent(key)}=${encodeURIComponent(value)}&`;
            }
        });
        urlFragment += `search=${encodeURIComponent(searchQuery)}`;
        history.pushState({}, '', urlFragment);
    }

    // Function to set up the page with search parameters from the URL
    function initializePageFromURL() {
        const { searchQuery, filters } = readURLForSearchParameters();
        activeSearchFilters = { searchQuery, filters };

        // 1. Update the search box with the search query from the URL
        document.getElementById('searchBox').value = activeSearchFilters.searchQuery;

        // 2. Update the filter dropdowns with the values from the URL
        Object.entries(filters).forEach(([key, value]) => {
            const filterDropdownId = key;
            const dropdown = document.getElementById(filterDropdownId);

            if (dropdown && value) {
                const option = dropdown.querySelector(`option[value="${value}"]`);
                if (option) {
                    option.selected = true;
                } else {
                    console.warn(`No option found for value ${value} in dropdown ${dropdown.id}`);
                }
            } else {
                console.warn(`No dropdown found for key ${key}`);
            }
        });

        // 3. Load the results based on the URL parameters
        generateFilteredBlogEntries();
    }

    // Function to update the display of active filters - values only
    function updateActiveFiltersDisplay(activeSearchFilters) {
        const { searchQuery, filters } = activeSearchFilters;
        
        // Start with an empty array to accumulate active filter descriptions
        let activeFiltersDescriptions = [];

        // Add each filter's value to the array if it has a value
        Object.entries(filters).forEach(([key, value]) => {
            if (value) {
                // Format the filter description as "key: value"
                // activeFiltersDescriptions.push(`${key}: ${value}`);
                // Only push the value, not the key: value format
                activeFiltersDescriptions.push(value);
            }
        });

        // If there's a search query, add it to the beginning of the array
        if (searchQuery!== '') {
            activeFiltersDescriptions.unshift(searchQuery); // Directly use the search query without additional formatting
        }

        const activeFiltersDiv = document.getElementById('activefilters');
        activeFiltersDiv.innerHTML = ''; // Clear the current display

        if (activeFiltersDescriptions.length > 0) {
            // Join all filter values with ' AND ' to represent a boolean AND operation
            const activeFiltersText = activeFiltersDescriptions.join(' AND ');
            activeFiltersDiv.textContent = `Search results for: ${activeFiltersText}`;
        } else {
            activeFiltersDiv.textContent = 'No active filters.';
        }
    }

    // Function to sort data asc/desc based on input. Created for the select id="sortOrder" dropdown in the ResultsPanel
    function sortData(data, order) {
        activeSortOrder = order; // Assign the passed order to activeSortOrder
        return data.sort((a, b) => {
            const dateA = new Date(a.Date.split('/')[1], a.Date.split('/')[0] - 1);
            const dateB = new Date(b.Date.split('/')[1], b.Date.split('/')[0] - 1);
            return order === 'newest'? dateB - dateA : dateA - dateB; // Sort in descending or ascending order based on the order parameter
        });
    }

    return {
        updateSearchQuery,
        updateFilters,
        updateSortOrder,
        applyFiltersAndSort,
        initializePage,
        resetFilters, // Include resetFilters in the returned object
        displayBlogEntries, // Include displayBlogEntries in the returned object
        initializePageFromURL, // in the returned object
        updateActiveFiltersDisplay,
        sortData
    };
}

// Usage
const appState = manageAppState();

function clearContainer(containerId) {
    const container = document.getElementById(containerId);
    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }
}

function attachEventListeners() {

    document.getElementById('downloadDataBadge').addEventListener('click', function() {
        downloadCsv(filteredData);
    });

    // Event listener to the "Share Results" badge
    document.getElementById('shareResultsBadge').addEventListener('click', shareResults);

    // Event listener for the search box
    document.getElementById('searchBox').addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            // Update the search query in appState and trigger a search
            appState.updateSearchQuery(this.value);
            appState.applyFiltersAndSort();
        }
    });

    document.getElementById('searchBox').addEventListener('blur', function() {
        // Update the search query in appState and trigger a search when the search box loses focus
        appState.updateSearchQuery(this.value);
        appState.applyFiltersAndSort();
    });

    document.getElementById('searchBox').addEventListener('input', function() {
        // On input, delay the call to allow the browser to process the "X" click
        setTimeout(() => {
            if (!this.value) {
                // If the input is cleared, treat it as a clear action
                appState.updateSearchQuery('');
                appState.applyFiltersAndSort();
            }
        }, 100); // the delay
    });

    document.getElementById("sortOrderDD").addEventListener("change", function() {
        appState.updateSortOrder(this.value);
        appState.applyFiltersAndSort();
    });

    // Attach an event listener to the ClearBtn
    document.getElementById('ClearBtn').addEventListener('click', function() {
        appState.resetFilters();
    });

    // Attach an event listener to the clearmeBtn
    document.getElementById('clearmeBtn').addEventListener('click', function() {
        appState.resetFilters();
    });

    // Event listener for the Apply button
    document.getElementById("ApplyBtn").addEventListener("click", function() {
        // 1. Get the current value of the search box
        const searchQuery = document.getElementById('searchBox').value;

        // 2. Get value of dropdown filters
        // Collect filter values into an object
        const filtersObj = {};
        const filters = ['yearFilter', 'cableFilter', 'typeFilter', 'causeFilter', 'countryFilter', 'companyFilter'];
        filters.forEach(id => {
            const value = document.getElementById(id).value.trim(); // Trim to remove whitespace
            if (value!== '' && value!== 'default') { // Check if the value is not empty and not the default placeholder
                filtersObj[id] = value;
            }
        });

        // Check if there are any meaningful filters to apply
        if (Object.keys(filtersObj).length > 0) {
            // Update the activeSearchFilters object and apply the filters
            appState.updateSearchQuery(searchQuery); // Assuming you want to reset the search query or keep it as is
            appState.updateFilters(filtersObj); // Update the filters in activeSearchFilters
            appState.applyFiltersAndSort(); // Apply the filters and sorting
        } else {
            // Optionally, provide feedback to the user if no meaningful filters are selected
            alert('Please select at least one filter to apply.');
        }
    });

    //console.log("Event listeners attached.");
}


async function initializeApp() {
    try {
        await appState.initializePage();
        attachEventListeners();
        initializePageFromURL(); // Call this function to initialize the page from URL parameters
    } catch (error) {
        console.error("Error initializing app:", error);
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    try {
        await initializeApp();
        //console.log("DOM loaded; Application initialized successfully.");

        // Adding the event listener for the filter toggle button
        document.getElementById('filterToggle').addEventListener('click', function() {
            var filterPanel = document.getElementById('searchFilters');
            filterPanel.classList.toggle('hidden');
        });

    } catch (error) {
        console.error("Error initializing app:", error);
    }
});


// Function to show number of results
function updateResultsCount() {
    const resultsContainer = document.getElementById('blogContainer');
    const resultsCount = resultsContainer.children.length;
    const resultsNumberElement = document.getElementById('resultsNumber');
    resultsNumberElement.textContent = `Showing ${resultsCount} result(s)`;
}

function shareResults() {
    // Copy the current URL to the clipboard
    navigator.clipboard.writeText(window.location.href).then(function() {
        const shareResultsBadge = document.getElementById('shareResultsBadge');
        // Save the first child node (which should be the SVG) and the second child node (the text node)
        const svgIconNode = shareResultsBadge.firstElementChild.cloneNode(true);

        // Change the badge text to "Link Copied"
        shareResultsBadge.innerHTML = ''; // Clear the current content
        //shareResultsBadge.appendChild(svgIconNode); // Append the SVG icon back
        const copiedTextNode = document.createTextNode('Link Copied');
        shareResultsBadge.appendChild(copiedTextNode); // Append the new text node

        // Revert the badge text back to "Share Results" after a short delay
        setTimeout(function() {
            shareResultsBadge.innerHTML = ''; // Clear the current content again
            shareResultsBadge.appendChild(svgIconNode); // Append the SVG icon back
            const originalTextNode = document.createTextNode('Share Results');
            shareResultsBadge.appendChild(originalTextNode); // Append the original text node back
        }, 2000); // Delay in milliseconds
    })
   .catch(err => {
        console.error('Failed to copy text: ', err);
    });
}

function downloadCsv(data, filename='subcables_events.csv') {
    // Ensure headers are included in the CSV
    const headers = Object.keys(data[0]);
    const csvContent = [
        headers.join(','), // Headers row
       ...data.map(row => headers.map(header => `"${row[header]}"`).join(',')) // Data rows
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    // Create a temporary anchor element and simulate a click to start the download
    const link = document.createElement('a');
    link.className = 'hidden'; 
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    //link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();

    // Cleanup
    document.body.removeChild(link);
}

// selectively expose only the functions that need to be called from outside of manageAppState()
// created to simplify the onclick handler for the ApplyBtn by automatically capturing the current state of the search box and filters without explicitly passing arguments to generateFilteredBlogEntries()
// maintains the encapsulation of your state management logic within manageAppState() while simplifying the onclick handler:
window.initializePageFromURL = function() {
    const appState = manageAppState();
    appState.initializePageFromURL();
};
window.generateFilteredBlogEntries = function() {
    const appState = manageAppState();
    appState.applyFiltersAndSort(); // this function triggers generateFilteredBlogEntries internally
};
window.resetFilters = function() {
    // Assuming resetFilters is defined within manageAppState and modifies appState accordingly
    const appState = manageAppState();
    appState.resetFilters();
};
window.getfilteredData = function() {
    // Assuming resetFilters is defined within manageAppState and modifies appState accordingly
    const appState = manageAppState();
    appState.getfilteredData();
};
