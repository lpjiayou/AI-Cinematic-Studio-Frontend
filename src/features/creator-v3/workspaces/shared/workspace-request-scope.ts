/** Local request identity only; never included in a Core request body. */
export class WorkspaceRequestScope {
  private active = false;
  private owner = "";
  private lifetime = 0;
  private readGeneration = 0;
  private readController: AbortController | null = null;
  private mutationController: AbortController | null = null;
  key: string | null = null;
  generation = 0;

  activate(projectRef: string) {
    this.dispose();
    this.owner = projectRef;
    this.active = true;
  }

  owns(projectRef: string) {
    return this.active && this.owner === projectRef;
  }

  bind(key: string | null) {
    if (this.key === key) return false;
    this.key = key;
    this.generation += 1;
    this.mutationController?.abort();
    this.mutationController = null;
    return true;
  }

  cancelRead() {
    this.readController?.abort();
    this.readController = null;
    this.readGeneration += 1;
  }

  reset() {
    this.cancelRead();
    this.bind(null);
  }

  beginRead() {
    this.cancelRead();
    const controller = new AbortController();
    this.readController = controller;
    const lifetime = this.lifetime;
    const generation = this.readGeneration;
    return {
      signal: controller.signal,
      current: () => this.active && !controller.signal.aborted &&
        lifetime === this.lifetime && generation === this.readGeneration,
      abort: () => controller.abort(),
      finish: () => { if (this.readController === controller) this.readController = null; },
    };
  }

  beginMutation(projectRef: string, key: string) {
    if (!this.owns(projectRef) || this.key !== key || this.mutationController || this.readController) return null;
    const controller = new AbortController();
    this.mutationController = controller;
    const lifetime = this.lifetime;
    const generation = this.generation;
    return {
      signal: controller.signal,
      generation,
      current: () => this.active && !controller.signal.aborted && lifetime === this.lifetime &&
        generation === this.generation && this.key === key,
      finish: () => { if (this.mutationController === controller) this.mutationController = null; },
    };
  }

  get mutating() { return this.mutationController !== null; }

  dispose() {
    this.active = false;
    this.lifetime += 1;
    this.cancelRead();
    this.mutationController?.abort();
    this.mutationController = null;
    this.key = null;
    this.generation += 1;
  }
}
