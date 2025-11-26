import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Task {
  id: number;
  title: string;
  completed: boolean;
  createdAt: Date;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit, OnDestroy {
  tasks: Task[] = [];
  newTaskTitle: string = '';
  isDarkMode: boolean = false;
  private nextId: number = 1;
  private storageKey = 'modern-todo-tasks';
  private themeKey = 'modern-todo-theme';

  ngOnInit() {
    // Load preferences from localStorage
    this.loadFromStorage();
    this.updateTheme();

    // Initialize with sample data if no tasks exist
    if (this.tasks.length === 0) {
      this.tasks = [
        {
          id: this.nextId++,
          title: 'Create a beautiful modern To-Do app 🎨',
          completed: true,
          createdAt: new Date(Date.now() - 86400000) // Yesterday
        },
        {
          id: this.nextId++,
          title: 'Learn Angular animations and transitions',
          completed: false,
          createdAt: new Date(Date.now() - 43200000) // 12 hours ago
        },
        {
          id: this.nextId++,
          title: 'Implement responsive design for all devices 📱',
          completed: false,
          createdAt: new Date()
        },
      ];
      this.saveToStorage();
    }
  }

  ngOnDestroy() {
    this.saveToStorage();
  }

  addTask() {
    const title = this.newTaskTitle.trim();
    if (title) {
      const newTask: Task = {
        id: this.nextId++,
        title,
        completed: false,
        createdAt: new Date()
      };

      this.tasks.unshift(newTask); // Add to beginning for better UX
      this.newTaskTitle = '';
      this.saveToStorage();

      // Add success feedback
      this.triggerSuccessFeedback();
    }
  }

  deleteTask(id: number) {
    const taskIndex = this.tasks.findIndex(task => task.id === id);
    if (taskIndex > -1) {
      this.tasks.splice(taskIndex, 1);
      this.saveToStorage();
    }
  }

  toggleTaskCompletion(task: Task) {
    task.completed = !task.completed;
    this.saveToStorage();

    // Move completed tasks to bottom after a brief delay
    if (task.completed) {
      setTimeout(() => {
        const completedTask = this.tasks.find(t => t.id === task.id);
        if (completedTask) {
          this.tasks = [
            ...this.tasks.filter(t => t.id !== task.id && !t.completed),
            ...this.tasks.filter(t => t.id !== task.id && t.completed),
            completedTask
          ];
          this.saveToStorage();
        }
      }, 300);
    } else {
      // Move uncompleted tasks to top
      setTimeout(() => {
        const uncompletedTask = this.tasks.find(t => t.id === task.id);
        if (uncompletedTask) {
          this.tasks = [
            uncompletedTask,
            ...this.tasks.filter(t => t.id !== task.id && !t.completed),
            ...this.tasks.filter(t => t.completed)
          ];
          this.saveToStorage();
        }
      }, 300);
    }
  }

  toggleTheme() {
    this.isDarkMode = !this.isDarkMode;
    this.updateTheme();
    this.saveToStorage();
  }

  get completedTasksCount(): number {
    return this.tasks.filter(task => task.completed).length;
  }

  get totalTasksCount(): number {
    return this.tasks.length;
  }

  get pendingTasksCount(): number {
    return this.tasks.filter(task => !task.completed).length;
  }

  private updateTheme() {
    const bodyClass = document.body.classList;
    if (this.isDarkMode) {
      bodyClass.add('dark-mode');
    } else {
      bodyClass.remove('dark-mode');
    }
  }

  private loadFromStorage() {
    try {
      // Load tasks
      const savedTasks = localStorage.getItem(this.storageKey);
      if (savedTasks) {
        const parsedTasks = JSON.parse(savedTasks);
        this.tasks = parsedTasks.map((task: any) => ({
          ...task,
          createdAt: new Date(task.createdAt)
        }));
        this.nextId = Math.max(...this.tasks.map(t => t.id), 0) + 1;
      }

      // Load theme preference
      const savedTheme = localStorage.getItem(this.themeKey);
      if (savedTheme) {
        this.isDarkMode = JSON.parse(savedTheme);
      } else {
        // Auto-detect system preference
        this.isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
      }
    } catch (error) {
      console.warn('Failed to load data from localStorage:', error);
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.tasks));
      localStorage.setItem(this.themeKey, JSON.stringify(this.isDarkMode));
    } catch (error) {
      console.warn('Failed to save data to localStorage:', error);
    }
  }

  private triggerSuccessFeedback() {
    // Add a subtle success animation to the add button
    const addBtn = document.querySelector('.add-task-btn');
    if (addBtn) {
      addBtn.classList.add('animate-bounce');
      setTimeout(() => {
        addBtn.classList.remove('animate-bounce');
      }, 600);
    }
  }

  // Track by function for better performance
  trackByTaskId(index: number, task: Task): number {
    return task.id;
  }

  // Get relative time for task creation
  getRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) {
      return 'Just now';
    } else if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  }

  // Keyboard shortcuts
  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    if (event.ctrlKey || event.metaKey) {
      switch (event.key) {
        case 'k':
          event.preventDefault();
          const input = document.querySelector('.task-input') as HTMLInputElement;
          input?.focus();
          break;
        case 'd':
          event.preventDefault();
          this.toggleTheme();
          break;
      }
    }
  }
}