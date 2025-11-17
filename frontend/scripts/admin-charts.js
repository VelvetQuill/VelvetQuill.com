

// admin-charts.js - SIMPLIFIED VERSION
class AdminCharts {
    constructor() {
        this.charts = {};
        this.init();
    }

    async init() {
        await this.loadBasicStats();
        this.renderCharts();
        this.bindEvents();
    }

    async loadBasicStats() {
        try {
            // Use existing API service methods
            const [dashboardStats, categories] = await Promise.all([
                window.apiService.getAdminStats(),
                window.apiService.getCategories()
            ]);

            this.statsData = {
                totalVisitors: dashboardStats.stats?.monthlyVisitors || 0,
                totalUsers: dashboardStats.stats?.totalUsers || 0,
                totalAuthors: dashboardStats.stats?.totalAuthors || 0,
                totalStories: dashboardStats.stats?.totalStories || 0,
                categories: categories.categories || []
            };

            this.updateStatsDisplay();
            
        } catch (error) {
            console.error('Failed to load stats:', error);
            // Fallback to basic data
            this.statsData = {
                totalVisitors: 0,
                totalUsers: 0,
                totalAuthors: 0,
                totalStories: 0,
                categories: []
            };
            this.updateStatsDisplay();
        }
    }

    updateStatsDisplay() {
        // Update quick stats cards
        $('#totalVisitors').text(this.statsData.totalVisitors.toLocaleString());
        $('#totalUsers').text(this.statsData.totalUsers.toLocaleString());
        $('#totalAuthors').text(this.statsData.totalAuthors.toLocaleString());
        $('#totalStories').text(this.statsData.totalStories.toLocaleString());
    }

    renderCharts() {
        this.renderUsersChart();
        this.renderCategoriesChart();
        this.renderStoriesChart();
    }

    renderUsersChart() {
        const ctx = $('#usersChart');
        if (!ctx.length) return;

        if (this.charts.usersChart) {
            this.charts.usersChart.destroy();
        }

        this.charts.usersChart = new Chart(ctx[0], {
            type: 'doughnut',
            data: {
                labels: ['Visitors', 'Registered Users', 'Authors'],
                datasets: [{
                    data: [
                        this.statsData.totalVisitors,
                        this.statsData.totalUsers,
                        this.statsData.totalAuthors
                    ],
                    backgroundColor: [
                        '#4CAF50',
                        '#2196F3', 
                        '#FF9800'
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'User Distribution'
                    }
                }
            }
        });
    }

    renderCategoriesChart() {
        const ctx = $('#categoriesChart');
        if (!ctx.length) return;

        if (this.charts.categoriesChart) {
            this.charts.categoriesChart.destroy();
        }

        const categories = this.statsData.categories.slice(0, 8); // Top 8 categories
        const labels = categories.map(cat => cat.name);
        const data = categories.map(cat => cat.metadata?.storyCount || 0);

        this.charts.categoriesChart = new Chart(ctx[0], {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Stories',
                    data: data,
                    backgroundColor: '#673AB7'
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Stories by Category'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    renderStoriesChart() {
        const ctx = $('#storiesChart');
        if (!ctx.length) return;

        if (this.charts.storiesChart) {
            this.charts.storiesChart.destroy();
        }

        this.charts.storiesChart = new Chart(ctx[0], {
            type: 'pie',
            data: {
                labels: ['Published Stories', 'Authors'],
                datasets: [{
                    data: [
                        this.statsData.totalStories,
                        this.statsData.totalAuthors
                    ],
                    backgroundColor: [
                        '#E91E63',
                        '#00BCD4'
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Content Overview'
                    }
                }
            }
        });
    }

    bindEvents() {
        // Refresh button
        $('#refreshStats').on('click', () => {
            this.loadBasicStats().then(() => {
                this.renderCharts();
                M.toast({html: 'Stats updated!', classes: 'green'});
            });
        });

        // Export simple data
        $('#exportStats').on('click', () => {
            this.exportStats();
        });
    }

    exportStats() {
        const data = {
            timestamp: new Date().toISOString(),
            stats: this.statsData
        };

        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `admin-stats-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        M.toast({html: 'Stats exported!', classes: 'green'});
    }
}

// Initialize when ready
$(document).ready(function() {
    if (!window.AuthManager || !window.AuthManager.isAdmin()) {
        window.location.href = '../frontend/signin.html';
        return;
    }

    window.adminCharts = new AdminCharts();
});


