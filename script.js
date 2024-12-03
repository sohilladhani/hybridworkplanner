// Constants for day types
const DAY_TYPES = {
    NONE: 'none',
    OFFICE: 'office',
    PTO: 'pto',
    HOME: 'home',
    HOLIDAY: 'holiday'
};
const THEME = {
    LIGHT: 'light',
    DARK: 'dark'
};


// Store the calendar data
let calendarData = {};
let currentDate = new Date();
let quarterStartDate = null;
let requiredDays = 36;

// DOM Elements
const quarterStartInput = document.getElementById('quarterStart');
const requiredDaysInput = document.getElementById('requiredDays');
const prevMonthBtn = document.getElementById('prevMonth');
const nextMonthBtn = document.getElementById('nextMonth');
const currentMonthElement = document.getElementById('currentMonth');
const calendarElement = document.getElementById('calendar');
const darkModeToggle = document.getElementById('darkModeToggle');
const completedDaysElement = document.getElementById('completedDays');
const ptoDaysElement = document.getElementById('ptoDays');
const holidayDaysElement = document.getElementById('holidayDays');
const remainingDaysElement = document.getElementById('remainingDays');

// Initialize dark mode
if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.documentElement.classList.add('dark');
}

// Event Listeners
darkModeToggle.addEventListener('click', toggleDarkMode);
quarterStartInput.addEventListener('change', handleQuarterStartChange);
requiredDaysInput.addEventListener('change', handleRequiredDaysChange);
prevMonthBtn.addEventListener('click', () => navigateMonth(-1));
nextMonthBtn.addEventListener('click', () => navigateMonth(1));
window.addEventListener('resize', () => {
    renderCalendar();
});


function toggleDarkMode() {
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('darkMode', document.documentElement.classList.contains('dark'));
}

function initializeTheme() {
    // Check localStorage first
    const darkMode = localStorage.getItem('darkMode');
    
    if (darkMode === 'true') {
        document.documentElement.classList.add('dark');
    } else if (darkMode === 'false') {
        document.documentElement.classList.remove('dark');
    } else {
        // If no localStorage value, check system preference
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('darkMode', 'true');
        } else {
            localStorage.setItem('darkMode', 'false');
        }
    }
}

function switchToQuarterIfNeeded() {
    if (!quarterStartDate) return;

    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    const quarterMonth = quarterStartDate.getMonth();
    const quarterYear = quarterStartDate.getFullYear();

    const quarterEndMonth = (quarterMonth + 2) % 12;
    const quarterEndYear = quarterYear + Math.floor((quarterMonth + 2) / 12);

    const isInQuarter = (currentYear < quarterEndYear) || 
                       (currentYear === quarterEndYear && currentMonth <= quarterEndMonth);

    if (!isInQuarter || currentYear < quarterYear || 
        (currentYear === quarterYear && currentMonth < quarterMonth)) {
        currentDate = new Date(quarterStartDate);
    }
}

function initializeQuarterData() {
    if (!quarterStartDate) return;

    const quarterEnd = new Date(quarterStartDate);
    quarterEnd.setMonth(quarterEnd.getMonth() + 3);

    // Set times to midnight for consistent comparison
    const startTime = new Date(quarterStartDate);
    startTime.setHours(0, 0, 0, 0);
    quarterEnd.setHours(0, 0, 0, 0);

    // Clear existing data for the quarter
    for (const dateString in calendarData) {
        const date = new Date(dateString);
        date.setHours(0, 0, 0, 0);
        if (date >= startTime && date < quarterEnd) {
            delete calendarData[dateString];
        }
    }

    // Initialize all weekdays as work from home
    let currentDate = new Date(startTime);
    while (currentDate < quarterEnd) {
        if (!isWeekend(currentDate)) {
            const dateString = currentDate.toISOString().split('T')[0];
            calendarData[dateString] = DAY_TYPES.HOME;
        }
        currentDate.setDate(currentDate.getDate() + 1);
    }
}

function handleQuarterStartChange(event) {
    quarterStartDate = new Date(event.target.value);
    initializeQuarterData();
    switchToQuarterIfNeeded();
    renderCalendar();
    updateSummary();
    saveCalendarData();
}

function handleRequiredDaysChange(event) {
    requiredDays = parseInt(event.target.value);
    updateSummary();
    saveCalendarData();
}

function navigateMonth(delta) {
    currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + delta, 1);
    renderCalendar();
}

function getCalendarDays(year, month) {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];

    for (let i = 0; i < firstDay.getDay(); i++) {
        days.push(null);
    }

    for (let i = 1; i <= lastDay.getDate(); i++) {
        days.push(new Date(year, month, i));
    }

    return days;
}

function isWeekend(date) {
    return date.getDay() === 0 || date.getDay() === 6;
}

function getDayType(date) {
    const dateString = date.toISOString().split('T')[0];
    const dateTime = new Date(date);
    dateTime.setHours(0, 0, 0, 0);
    
    if (quarterStartDate) {
        const quarterEnd = new Date(quarterStartDate);
        quarterEnd.setMonth(quarterEnd.getMonth() + 3);
        const startTime = new Date(quarterStartDate);
        
        startTime.setHours(0, 0, 0, 0);
        quarterEnd.setHours(0, 0, 0, 0);
        
        if (dateTime >= startTime && dateTime < quarterEnd && !isWeekend(date)) {
            return calendarData[dateString] || DAY_TYPES.HOME;
        }
    }
    
    return calendarData[dateString] || DAY_TYPES.NONE;
}

function setDayType(date, type) {
    const dateString = date.toISOString().split('T')[0];
    calendarData[dateString] = type;
    updateSummary();
    saveCalendarData();
}

function cycleDayType(date) {
    if (isWeekend(date)) return;

    const currentType = getDayType(date);
    let nextType;

    switch (currentType) {
        case DAY_TYPES.HOME:
            nextType = DAY_TYPES.OFFICE;
            break;
        case DAY_TYPES.OFFICE:
            nextType = DAY_TYPES.PTO;
            break;
        case DAY_TYPES.PTO:
            nextType = DAY_TYPES.HOLIDAY;
            break;
        case DAY_TYPES.HOLIDAY:
            nextType = DAY_TYPES.HOME;
            break;
        default:
            nextType = DAY_TYPES.HOME;
    }
    
    setDayType(date, nextType);
    renderCalendar();
}

function getDayClass(date, type) {
    if (isWeekend(date)) {
        return 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed';
    }

    switch (type) {
        case DAY_TYPES.OFFICE:
            return 'bg-blue-200 dark:bg-blue-800 hover:bg-blue-300 dark:hover:bg-blue-700';
        case DAY_TYPES.PTO:
            return 'bg-orange-200 dark:bg-orange-800 hover:bg-orange-300 dark:hover:bg-orange-700';
        case DAY_TYPES.HOME:
            return 'bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500';
        case DAY_TYPES.HOLIDAY:
            return 'bg-red-200 dark:bg-red-800 hover:bg-red-300 dark:hover:bg-red-700';
        default:
            return 'bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700';
    }
}

function calculateMonthlyOfficeDays(year, month) {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    let officeDays = 0;

    let currentDay = new Date(firstDay);
    while (currentDay <= lastDay) {
        if (getDayType(currentDay) === DAY_TYPES.OFFICE) {
            officeDays++;
        }
        currentDay.setDate(currentDay.getDate() + 1);
    }

    return officeDays;
}

function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const days = getCalendarDays(year, month);

    const officeDays = calculateMonthlyOfficeDays(year, month);
    const monthFormat = window.innerWidth < 768 ? 'short' : 'long';
    currentMonthElement.textContent = `${new Date(year, month, 1).toLocaleDateString('default', {
        month: monthFormat,
        year: 'numeric'
    })} (Office Days: ${officeDays})`;

    calendarElement.innerHTML = '';

    days.forEach(date => {
        const dayElement = document.createElement('button'); // Changed to button for better interaction
        
        // Base classes that ensure proper tile sizing and spacing
        const baseClasses = 'w-full aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-colors duration-200';

        if (date) {
            const type = getDayType(date);
            dayElement.className = `${baseClasses} ${getDayClass(date, type)}`;
            dayElement.textContent = date.getDate();
            
            if (!isWeekend(date)) {
                dayElement.addEventListener('click', () => cycleDayType(date));
            }
        } else {
            dayElement.className = `${baseClasses} invisible`;
        }

        calendarElement.appendChild(dayElement);
    });
}

function updateSummary() {
    if (!quarterStartDate) return;

    const quarterEnd = new Date(quarterStartDate);
    quarterEnd.setMonth(quarterEnd.getMonth() + 3);

    let officeDays = 0;
    let ptoDays = 0;
    let holidayDays = 0;

    let currentDate = new Date(quarterStartDate);
    currentDate.setHours(0, 0, 0, 0);
    quarterEnd.setHours(0, 0, 0, 0);

    while (currentDate < quarterEnd) {
        if (!isWeekend(currentDate)) {
            const type = getDayType(currentDate);
            switch (type) {
                case DAY_TYPES.OFFICE:
                    officeDays++;
                    break;
                case DAY_TYPES.PTO:
                    ptoDays++;
                    break;
                case DAY_TYPES.HOLIDAY:
                    holidayDays++;
                    break;
            }
        }
        currentDate.setDate(currentDate.getDate() + 1);
    }

    // Calculate working days by including both office days and PTO days
    const totalWorkingDays = officeDays + ptoDays;

    completedDaysElement.textContent = totalWorkingDays;
    ptoDaysElement.textContent = ptoDays;
    holidayDaysElement.textContent = holidayDays;
    remainingDaysElement.textContent = Math.max(0, requiredDays - totalWorkingDays);
}



function saveCalendarData() {
    localStorage.setItem('calendarData', JSON.stringify(calendarData));
    localStorage.setItem('quarterStartDate', quarterStartDate ? quarterStartDate.toISOString() : null);
    localStorage.setItem('requiredDays', requiredDays.toString());
}

function loadCalendarData() {
    const savedCalendarData = localStorage.getItem('calendarData');
    const savedQuarterStart = localStorage.getItem('quarterStartDate');
    const savedRequiredDays = localStorage.getItem('requiredDays');

    if (savedCalendarData) {
        calendarData = JSON.parse(savedCalendarData);
    }
    if (savedQuarterStart && savedQuarterStart !== 'null') {
        quarterStartDate = new Date(savedQuarterStart);
        quarterStartInput.value = savedQuarterStart.split('T')[0];
        currentDate = new Date(quarterStartDate);
    }
    if (savedRequiredDays) {
        requiredDays = parseInt(savedRequiredDays);
        requiredDaysInput.value = requiredDays;
    }
}


// Initial setup
loadCalendarData();
initializeTheme();
renderCalendar();
updateSummary();