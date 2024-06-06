# About

This webpage lists an non-exhaustive list of submarine cable developments, disruptions and reports of interference. Its focus is historic events and incidents with possible geopolitical implications. But it also contains incidents that show the breadth of causes of submarine cable damage.

The webpage is accessible [here](https://technoid99.github.io/SubcableIncidents/)

The main features of this webpage are that that the user can filter through the items via the free text search box and/or the dropdown filters. The results can then be downloaded into a CSV. The results can also be shared via the unique URL for that search result.

# Design
index.html defines the webpage design
main.js contains all the JavaScript code
styles.css contains all the styles for the GUI

The JavaScript code in main.js is responsible for fetching data from a Google Sheets document, populating filter dropdowns based on the fetched data, managing the application state (including search query and filters), sorting the displayed data, and providing functionalities for sharing and downloading the filtered data. Additionally, there is a separate styles.css file that handles the styling of the graphical user interface (GUI) elements.

Here's a breakdown of its core functionalities:

1. **Fetching Data**: The program starts by fetching data from a Google Sheets document using the `fetchCSV` function. This data is then parsed into a more usable format using the Papa Parse library.

2. **Populating Filters**: Upon loading the data, the program populates various filter dropdowns (`yearFilter`, `cableFilter`, `typeFilter`, `causeFilter`, `countryFilter`, `companyFilter`) with unique values extracted from the fetched data. This allows users to filter the displayed incidents and events based on different criteria such as year, cable involved, type of event, cause, country, and company.

3. **Searching and Filtering**: Users can search for specific terms within the details of the incidents/events and apply filters through the populated dropdowns. The `manageAppState` function manages the state of the search query and applied filters, allowing for dynamic updates to the displayed data based on user input.

4. **Sorting**: The program provides functionality to sort the displayed data either by newest or oldest first, based on the date of the incident/event.

5. **Displaying Results**: The filtered and sorted data is displayed in a structured format, including a brief description and relevant tags (e.g., Type, Cause). Each entry is presented in a Bootstrap-styled card layout.

6. **Sharing and Downloading Results**: There are features to share the current results page via copying the URL to the clipboard and downloading the filtered data as a CSV file.

7. **Initialization and Event Handling**: The program initializes itself by loading the data, setting up the filters, and attaching event listeners to various UI elements (e.g., search box, filter dropdowns, buttons for applying filters, resetting filters, sharing results, downloading data). It also supports initialization from URL parameters, allowing users to bookmark or share specific searches/filter configurations.

Overall, the program aims to provide a user-friendly interface for exploring and analyzing data on submarine cable incidents and events, offering robust filtering, searching, and sorting capabilities.
