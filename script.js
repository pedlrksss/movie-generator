let displayedMovies = [];
const apiKey = '2040040352cfe52696ade7e1f96634fa';
const genreSelect = document.getElementById('genre-filter');
const historyDiv = document.getElementById('movie-history');
const historyToggle = document.getElementById('movie-history-toggle');
const movieGrid = document.querySelector('#movie-history .movie-grid');
const prevPageButton = document.getElementById('prev-page');
const nextPageButton = document.getElementById('next-page');
const keywordInput = document.getElementById('keyword-input');
const addKeywordButton = document.getElementById('add-keyword-button');
const keywordContainer = document.getElementById('keyword-container');
const generateButton = document.getElementById('generate-button');
const pageSize = 25;
let currentPage = 0;
let keywords = [];
let searchResults = [];
let moviePageData = [];
let displayedMovieIds = new Set();

document.getElementById('generate-button').addEventListener('click', generateMovie);
genreSelect.addEventListener('change', generateMovie);
historyToggle.addEventListener('click', toggleHistoryVisibility);
prevPageButton.addEventListener('click', () => changePage(-1));
nextPageButton.addEventListener('click', () => changePage(1));
addKeywordButton.addEventListener('click', addKeyword);

document.addEventListener('DOMContentLoaded', fetchGenres);

document.addEventListener('DOMContentLoaded', () => {
    const darkModeToggle = document.querySelector('.dark-mode-toggle');
    const isDarkMode = localStorage.getItem('dark-mode') === 'true';
    
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
        darkModeToggle.textContent = 'Modo Claro';
    }

    darkModeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        const darkModeEnabled = document.body.classList.contains('dark-mode');
        localStorage.setItem('dark-mode', darkModeEnabled);
        darkModeToggle.textContent = darkModeEnabled ? 'Modo Claro' : 'Modo Escuro';
    });
});


async function fetchGenres() {
    const url = `https://api.themoviedb.org/3/genre/movie/list?api_key=${apiKey}&language=pt-BR`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        data.genres.forEach(genre => {
            const option = document.createElement('option');
            option.value = genre.id;
            option.textContent = genre.name;
            genreSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Erro ao buscar gêneros:', error);
    }
}

async function generateMovie() {
    if (keywords.length > 0) {
        await searchMovies(); 
        return;
    }

    const selectedGenre = genreSelect.value;
    const page = Math.floor(Math.random() * 500) + 1;
    const url = selectedGenre
        ? `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&with_genres=${selectedGenre}&language=pt-BR&page=${page}`
        : `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&language=pt-BR&page=${page}`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        let movies = data.results
            .filter(movie => !displayedMovieIds.has(movie.id)) 
            .filter(movie => movie.vote_average >= 2);

        if (movies.length > 0) {
            movies = shuffleArray(movies);
            const randomMovie = movies[0]; 
            displayMovie(randomMovie);
            updateHistory(randomMovie);
        } else {
            alert('Nenhum filme encontrado.');
        }
    } catch (error) {
        console.error('Erro ao buscar filmes:', error);
    }
}


function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

async function searchMovies() {
    if (keywords.length === 0) {
        alert('Por favor, adicione ao menos uma palavra-chave.');
        return;
    }

    const keywordIds = await Promise.all(keywords.map(keyword => getKeywordId(keyword)));
    if (keywordIds.length > 0) {
        const keywordQuery = keywordIds.filter(id => id !== null).join(',');
        const url = `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&language=pt-BR&with_keywords=${keywordQuery}`;

        try {
            searchResults = [];
            let page = 1;
            while (page <= 5) { 
                const response = await fetch(`${url}&page=${page}`);
                const data = await response.json();
                let newResults = data.results.filter(movie => movie.vote_average >= 2)
                    .filter(movie => !displayedMovieIds.has(movie.id));
                
                if (newResults.length === 0) break; 

                searchResults = searchResults.concat(newResults);
                page++;
            }

            if (searchResults.length > 0) {
                displaySearchMovie();
            } else {
                alert('Nenhum filme encontrado para as palavras-chave fornecidas.');
            }
        } catch (error) {
            console.error('Erro ao buscar filmes:', error);
        }
    } else {
        alert('Nenhuma palavra-chave correspondente encontrada.');
    }
}

async function getKeywordId(query) {
    const url = `https://api.themoviedb.org/3/search/keyword?api_key=${apiKey}&query=${encodeURIComponent(query)}`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        return data.results.length > 0 ? data.results[0].id : null;
    } catch (error) {
        console.error('Erro ao buscar ID da palavra-chave:', error);
        return null;
    }
}

function displaySearchMovie() {
    if (searchResults.length === 0) {
        alert('Nenhum filme encontrado.');
        return;
    }
    const randomMovie = searchResults[Math.floor(Math.random() * searchResults.length)];
    displayMovie(randomMovie);
}

function addKeyword() {
    const keyword = keywordInput.value.trim();
    if (keyword && !keywords.includes(keyword)) {
        keywords.push(keyword);
        displayKeywords();
    }
    keywordInput.value = '';
}

function displayKeywords() {
    keywordContainer.innerHTML = '';
    keywords.forEach(keyword => {
        const keywordElement = document.createElement('div');
        keywordElement.className = 'keyword';
        keywordElement.innerHTML = `${keyword} <button onclick="removeKeyword('${keyword}')">&times;</button>`;
        keywordContainer.appendChild(keywordElement);
    });
}

function removeKeyword(keyword) {
    keywords = keywords.filter(kw => kw !== keyword);
    displayKeywords();
}

function displayMovie(movie) {
    const movieInfo = document.getElementById('movie-info');
    movieInfo.innerHTML = `
        <h2>${movie.title}</h2>
        <p><strong>Data de Lançamento:</strong> ${movie.release_date}</p>
        <button class="toggle-synopsis" onclick="toggleSynopsis()">Ver Sinopse</button>
        <p class="synopsis">${movie.overview}</p>
        <img src="https://image.tmdb.org/t/p/w500${movie.poster_path}" alt="${movie.title} Poster">
        
    `;

    const toggleSynopsisButton = movieInfo.querySelector('.toggle-synopsis');
    const synopsis = movieInfo.querySelector('.synopsis');

    toggleSynopsisButton.addEventListener('click', () => {
        synopsis.classList.toggle('expanded');
        toggleSynopsisButton.textContent = synopsis.classList.contains('expanded') ? 'Ocultar Sinopse' : 'Ver Sinopse';
    });

    displayedMovies.unshift(movie);
    displayedMovieIds.add(movie.id);

    if (displayedMovies.length > pageSize * 5) { 
        const removedMovie = displayedMovies.pop();
        displayedMovieIds.delete(removedMovie.id); 
    }

    
    if (!historyDiv.classList.contains('hidden')) {
        renderPage(currentPage);
    }
}

function updateHistory(movie) {
    
    if (!displayedMovieIds.has(movie.id)) {
        displayedMovies.unshift(movie);
        displayedMovieIds.add(movie.id);

       
        if (displayedMovies.length > pageSize * 5) {
            const removedMovie = displayedMovies.pop();
            displayedMovieIds.delete(removedMovie.id);
        }

        if (!historyDiv.classList.contains('hidden')) {
            renderPage(currentPage);
        }
    }
}

function toggleHistoryVisibility() {
    if (historyDiv.classList.contains('hidden')) {
        historyDiv.classList.remove('hidden');
        historyToggle.textContent = 'Ocultar Histórico';
        renderPage(currentPage);
    } else {
        historyDiv.classList.add('hidden');
        historyToggle.textContent = 'Mostrar Histórico';
    }
}

function renderPage(page) {
    movieGrid.innerHTML = '';
    const start = page * pageSize;
    const end = start + pageSize;
    const moviesToDisplay = displayedMovies.slice(start, end);

    moviesToDisplay.forEach(movie => {
        const movieEntry = document.createElement('div');
        movieEntry.className = 'movie-entry';
        movieEntry.innerHTML = `
            <img src="https://image.tmdb.org/t/p/w200${movie.poster_path}" alt="${movie.title} Poster">
            <h3>${movie.title}</h3>
            <p><strong>Data de Lançamento:</strong> ${movie.release_date}</p>
        `;
        movieGrid.appendChild(movieEntry);
    });

    updatePaginationControls();
}

function updatePaginationControls() {
    const totalPages = Math.ceil(displayedMovies.length / pageSize);
    prevPageButton.classList.toggle('disabled', currentPage === 0);
    nextPageButton.classList.toggle('disabled', currentPage >= totalPages - 1);
}

function changePage(direction) {
    const newPage = currentPage + direction;
    const totalPages = Math.ceil(displayedMovies.length / pageSize);
    
    if (newPage >= 0 && newPage < totalPages) {
        currentPage = newPage;
        renderPage(currentPage);
    }
}

