// Modern service container with dependency injection
class ServiceContainer {
  private services = new Map<string, any>();
  private factories = new Map<string, () => any>();

  register<T>(name: string, factory: () => T): void {
    this.factories.set(name, factory);
  }

  get<T>(name: string): T {
    if (this.services.has(name)) {
      return this.services.get(name);
    }

    const factory = this.factories.get(name);
    if (!factory) {
      throw new Error(`Service '${name}' not found`);
    }

    const service = factory();
    this.services.set(name, service);
    return service;
  }

  has(name: string): boolean {
    return this.factories.has(name) || this.services.has(name);
  }
}

export const container = new ServiceContainer();

// Service registration
export const registerServices = () => {
  container.register('apiClient', () => import('./api/ApiClient').then(m => new m.ApiClient()));
  container.register('tournamentService', () => import('./tournament/TournamentService').then(m => new m.TournamentService()));
  container.register('userService', () => import('./user/UserService').then(m => new m.UserService()));
  container.register('analyticsService', () => import('./analytics/AnalyticsService').then(m => new m.AnalyticsService()));
};

// Service hooks
export const useService = <T>(name: string): T => {
  return container.get<T>(name);
};
