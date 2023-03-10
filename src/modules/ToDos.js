import {
  dragEnd, dragOver, dragStart,
} from './drag.js';
import ToDo from './ToDo.js';

export default class ToDos {
  constructor(container) {
    this.container = container;
    this.todos = JSON.parse(localStorage.getItem('todos')) || [];
    if (this.todos.length > 0) {
      this.loadPrevious();
    }
    this.isEditEnabled = false;

    this.container.addEventListener('dragover', (e) => {
      dragOver(this.container, e);
    });
  }

  clearList() {
    const todosUI = [...this.container.children];
    todosUI.forEach((todo) => {
      todo.remove();
    });
    this.todos = [];
    this.saveLocally();
  }

  loadPrevious() {
    const instances = [];
    const fragment = document.createDocumentFragment();
    this.todos.forEach(({
      description, completed, index, id,
    }) => {
      const instance = new ToDo(description, completed, index, id);
      instances.push(instance);
      const todoHtml = instance.createHtml();
      this.addEvents(todoHtml);
      fragment.appendChild(todoHtml);
    });
    this.container.appendChild(fragment);
    this.todos = instances;
    this.saveLocally();
  }

  saveLocally() {
    localStorage.setItem('todos', JSON.stringify(this.todos));
  }

  removeSelected() {
    this.todos.forEach((todo) => {
      if (todo.completed) {
        this.delete(this.container.querySelector(`#${todo.id}`));
      }
    });
  }

  fixIndex() {
    this.todos.forEach((todo, index) => {
      todo.index = index + 1;
    });
  }

  orderBasedOnUI() {
    const todosUI = [...this.container.children];
    const ordered = [];
    todosUI.forEach((todo) => {
      ordered.push(this.todos.find(({ id }) => id === todo.id));
    });
    this.todos = ordered;
    this.fixIndex();
    this.saveLocally();
  }

  check(todo, input) {
    this.todos.forEach((element) => {
      if (element.id === todo.id) {
        element.completed = input.checked;
      }
    });
    this.saveLocally();
    if (input.checked) {
      input.setAttribute('checked', '');
      todo.querySelector('input[type="text"]').classList.add('completed');
      return;
    }
    todo.querySelector('input[type="text"]').classList.remove('completed');
    input.removeAttribute('checked', '');
  }

  focusIn(todo, input) {
    todo.classList.add('todo--focus');
    input.classList.remove('completed');
    this.isEditEnabled = true;
  }

  focusOut(todo, input) {
    todo.classList.remove('todo--focus');
    this.todos.forEach((element) => {
      if (element.id === todo.id) {
        element.description = input.value;
        if (element.completed) {
          input.classList.add('completed');
        }
      }
    });
    if (input.value.trim() === '') {
      this.delete(todo);
    }
    this.saveLocally();
    this.isEditEnabled = false;
  }

  delete(todo) {
    const filtered = this.todos.filter(({ id }) => id !== todo.id);
    this.todos = filtered;
    this.fixIndex();
    todo.remove();
    this.saveLocally();
  }

  addEvents(todo) {
    todo.querySelector('input[type="checkbox"]').addEventListener('change', ({ target }) => {
      this.check(todo, target);
    });
    todo.querySelector('input[type="text"]').addEventListener('focusin', ({ target }) => {
      this.focusIn(todo, target);
    });
    todo.querySelector('input[type="text"]').addEventListener('focusout', ({ relatedTarget, target }) => {
      if (relatedTarget !== null && relatedTarget.classList.contains('btnDelete')) return;
      this.focusOut(todo, target);
    });
    todo.querySelector('.btnDelete').addEventListener('click', () => {
      this.delete(todo);
    });

    todo.addEventListener('dragstart', (e) => {
      this.focusOut(todo, todo.querySelector('input[type="text"]'));
      dragStart(todo, e);
    });

    todo.addEventListener('dragend', () => {
      dragEnd(todo);
      this.orderBasedOnUI();
    });
  }

  add(description, completed = false) {
    const todo = new ToDo(description, completed, this.todos.length + 1, ToDos.genId());
    this.todos.push(todo);
    const todoHtml = todo.createHtml();
    this.addEvents(todoHtml);
    this.container.appendChild(todoHtml);
    this.saveLocally();
  }

  static genId(tokenLen = 16) {
    let id = 'a';
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < tokenLen; i += 1) {
      id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
  }
}
