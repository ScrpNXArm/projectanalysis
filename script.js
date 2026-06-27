// Advanced To-Do List Application - Supabase Cloud Sync Version

class AdvancedTodoApp {
    constructor() {
        this.todos = [];
        this.currentFilter = 'all';
        this.currentCategoryFilter = 'all';
        this.editingId = null;
        this.isDarkMode = false;
        this.user = null;
        this.init();
    }

    async init() {
        this.loadThemePreference();

        // Pastikan user sudah login - kalau tak, redirect ke auth.html
        const { data: { session } } = await supabaseClient.auth.getSession();

        if (!session) {
            window.location.href = 'auth.html';
            return;
        }

        this.user = session.user;
        this.renderUserInfo();

        // Dengar perubahan auth state (contoh: token expire / logout dari tab lain)
        supabaseClient.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_OUT' || !session) {
                window.location.href = 'auth.html';
            }
        });

        this.setupEventListeners();
        await this.loadTodos();
    }

    setupEventListeners() {
        // Add task
        document.getElementById('addBtn').addEventListener('click', () => this.addTask());
        document.getElementById('todoInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTask();
        });

        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => this.toggleTheme());

        // Logout
        document.getElementById('logoutBtn')?.addEventListener('click', () => this.logout());

        // Filters
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.setFilter(e.target.dataset.filter));
        });

        document.getElementById('categoryFilter').addEventListener('change', (e) => {
            this.currentCategoryFilter = e.target.value;
            this.render();
        });

        // Clear completed
        document.getElementById('clearBtn').addEventListener('click', () => this.clearCompleted());

        // Modal controls
        document.querySelector('.close').addEventListener('click', () => this.closeModal());
        document.getElementById('cancelEditBtn').addEventListener('click', () => this.closeModal());
        document.getElementById('saveEditBtn').addEventListener('click', () => this.saveEdit());
    }

    renderUserInfo() {
        const el = document.getElementById('userEmail');
        if (el && this.user) {
            el.textContent = this.user.user_metadata?.full_name || this.user.email;
        }
    }

    async logout() {
        await supabaseClient.auth.signOut();
        window.location.href = 'auth.html';
    }

    // ===== Supabase CRUD =====

    async loadTodos() {
        try {
            const { data, error } = await supabaseClient
                .from('todos')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            this.todos = data || [];
            this.render();
        } catch (error) {
            console.error('Failed to load todos:', error);
            alert('Gagal load tasks dari server: ' + error.message);
        }
    }

    async addTask() {
        const input = document.getElementById('todoInput');
        const category = document.getElementById('categorySelect').value;
        const priority = document.getElementById('prioritySelect').value;
        const dueDate = document.getElementById('dueDateInput').value;

        const taskText = input.value.trim();
        if (taskText === '') {
            alert('Please enter a task!');
            return;
        }

        try {
            const { data, error } = await supabaseClient
                .from('todos')
                .insert({
                    text: taskText,
                    completed: false,
                    category: category,
                    priority: priority,
                    due_date: dueDate || null,
                    user_id: this.user.id
                })
                .select()
                .single();

            if (error) throw error;

            this.todos.unshift(data);
            this.render();

            // Reset inputs
            input.value = '';
            document.getElementById('categorySelect').value = 'General';
            document.getElementById('prioritySelect').value = 'medium';
            document.getElementById('dueDateInput').value = '';
            input.focus();
        } catch (error) {
            console.error('Failed to add task:', error);
            alert('Gagal tambah task: ' + error.message);
        }
    }

    async deleteTask(id) {
        if (!confirm('Are you sure you want to delete this task?')) return;

        try {
            const { error } = await supabaseClient
                .from('todos')
                .delete()
                .eq('id', id);

            if (error) throw error;

            this.todos = this.todos.filter(todo => todo.id !== id);
            this.render();
        } catch (error) {
            console.error('Failed to delete task:', error);
            alert('Gagal delete task: ' + error.message);
        }
    }

    async toggleTask(id) {
        const task = this.todos.find(todo => todo.id === id);
        if (!task) return;

        const newStatus = !task.completed;

        try {
            const { error } = await supabaseClient
                .from('todos')
                .update({ completed: newStatus })
                .eq('id', id);

            if (error) throw error;

            task.completed = newStatus;
            this.render();
        } catch (error) {
            console.error('Failed to toggle task:', error);
            alert('Gagal update task: ' + error.message);
        }
    }

    openEditModal(id) {
        const task = this.todos.find(todo => todo.id === id);
        if (!task) return;

        this.editingId = id;
        document.getElementById('editTaskInput').value = task.text;
        document.getElementById('editPrioritySelect').value = task.priority;
        document.getElementById('editCategorySelect').value = task.category;
        document.getElementById('editDueDateInput').value = task.due_date || '';
        document.getElementById('editModal').style.display = 'block';
    }

    closeModal() {
        document.getElementById('editModal').style.display = 'none';
        this.editingId = null;
    }

    async saveEdit() {
        if (!this.editingId) return;

        const task = this.todos.find(todo => todo.id === this.editingId);
        if (!task) return;

        const newText = document.getElementById('editTaskInput').value.trim();
        if (newText === '') {
            alert('Task description cannot be empty!');
            return;
        }

        const updatedFields = {
            text: newText,
            priority: document.getElementById('editPrioritySelect').value,
            category: document.getElementById('editCategorySelect').value,
            due_date: document.getElementById('editDueDateInput').value || null
        };

        try {
            const { error } = await supabaseClient
                .from('todos')
                .update(updatedFields)
                .eq('id', this.editingId);

            if (error) throw error;

            Object.assign(task, updatedFields);
            this.closeModal();
            this.render();
        } catch (error) {
            console.error('Failed to save edit:', error);
            alert('Gagal simpan perubahan: ' + error.message);
        }
    }

    async clearCompleted() {
        if (!confirm('Are you sure you want to delete all completed tasks?')) return;

        const completedIds = this.todos.filter(todo => todo.completed).map(todo => todo.id);
        if (completedIds.length === 0) return;

        try {
            const { error } = await supabaseClient
                .from('todos')
                .delete()
                .in('id', completedIds);

            if (error) throw error;

            this.todos = this.todos.filter(todo => !todo.completed);
            this.render();
        } catch (error) {
            console.error('Failed to clear completed:', error);
            alert('Gagal clear completed tasks: ' + error.message);
        }
    }

    // ===== Filter & Render (sama macam sebelum ini) =====

    setFilter(filter) {
        this.currentFilter = filter;
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.filter === filter) {
                btn.classList.add('active');
            }
        });
        this.render();
    }

    getFilteredTodos() {
        let filtered = this.todos;

        switch (this.currentFilter) {
            case 'active':
                filtered = filtered.filter(todo => !todo.completed);
                break;
            case 'completed':
                filtered = filtered.filter(todo => todo.completed);
                break;
        }

        if (this.currentCategoryFilter !== 'all') {
            filtered = filtered.filter(todo => todo.category === this.currentCategoryFilter);
        }

        return filtered;
    }

    isOverdue(dueDate, completed) {
        if (!dueDate || completed) return false;
        return new Date(dueDate) < new Date();
    }

    getOverdueCount() {
        return this.todos.filter(todo => this.isOverdue(todo.due_date, todo.completed)).length;
    }

    toggleTheme() {
        this.isDarkMode = !this.isDarkMode;
        document.body.classList.toggle('dark-mode', this.isDarkMode);
        localStorage.setItem('theme', this.isDarkMode ? 'dark' : 'light');
        this.updateThemeButtonText();
    }

    loadThemePreference() {
        const savedTheme = localStorage.getItem('theme');
        this.isDarkMode = savedTheme === 'dark';
        if (this.isDarkMode) {
            document.body.classList.add('dark-mode');
        }
        this.updateThemeButtonText();
    }

    updateThemeButtonText() {
        const btn = document.getElementById('themeToggle');
        btn.textContent = this.isDarkMode ? '☀️ Light Mode' : '🌙 Dark Mode';
    }

    updateStats() {
        const total = this.todos.length;
        const completed = this.todos.filter(todo => todo.completed).length;
        const overdue = this.getOverdueCount();

        document.getElementById('totalTasks').textContent = `Total: ${total}`;
        document.getElementById('completedTasks').textContent = `Completed: ${completed}`;
        document.getElementById('overdueTasks').textContent = `Overdue: ${overdue}`;
    }

    formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString + 'T00:00:00');
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    render() {
        const todoList = document.getElementById('todoList');
        const filteredTodos = this.getFilteredTodos();

        todoList.innerHTML = '';

        if (filteredTodos.length === 0) {
            todoList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📭</div>
                    <div class="empty-state-text">
                        ${this.currentFilter === 'all' && this.currentCategoryFilter === 'all'
                            ? 'No tasks yet. Create one to get started!'
                            : 'No tasks in this category.'}
                    </div>
                </div>
            `;
        } else {
            filteredTodos.forEach(todo => {
                const isOverdue = this.isOverdue(todo.due_date, todo.completed);
                const todoItem = document.createElement('div');
                todoItem.className = `todo-item ${todo.completed ? 'completed' : ''} ${isOverdue ? 'overdue' : ''}`;

                let dueDateHtml = '';
                if (todo.due_date) {
                    dueDateHtml = `<span class="todo-due-date ${isOverdue ? 'overdue' : ''}">📅 ${this.formatDate(todo.due_date)}</span>`;
                }

                todoItem.innerHTML = `
                    <input
                        type="checkbox"
                        class="todo-checkbox"
                        ${todo.completed ? 'checked' : ''}
                        onchange="app.toggleTask(${todo.id})"
                    >
                    <div class="todo-content">
                        <span class="todo-text">${this.escapeHtml(todo.text)}</span>
                        <div class="todo-meta">
                            <span class="todo-category">${this.escapeHtml(todo.category)}</span>
                            <span class="todo-priority priority-${todo.priority}">${todo.priority.toUpperCase()}</span>
                            ${dueDateHtml}
                        </div>
                    </div>
                    <div class="todo-actions">
                        <button class="edit-btn" onclick="app.openEditModal(${todo.id})">✏️ Edit</button>
                        <button class="delete-btn" onclick="app.deleteTask(${todo.id})">🗑️ Delete</button>
                    </div>
                `;
                todoList.appendChild(todoItem);
            });
        }

        this.updateStats();
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the app
const app = new AdvancedTodoApp();
