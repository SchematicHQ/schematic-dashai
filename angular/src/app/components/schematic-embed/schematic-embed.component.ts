import {
  Component,
  Input,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
} from '@angular/core';

/**
 * React-in-Angular bridge for SchematicEmbed.
 * Uses React's createRoot() to mount the SchematicEmbed component
 * from @schematichq/schematic-components.
 */
@Component({
  selector: 'app-schematic-embed',
  template: `<div #embedContainer></div>`,
})
export class SchematicEmbedComponent
  implements AfterViewInit, OnDestroy, OnChanges
{
  @Input() accessToken: string | null = null;
  @Input() componentId: string | null = null;

  @ViewChild('embedContainer', { static: true }) container!: ElementRef;

  private root: any = null;
  private React: any = null;
  private ReactDOM: any = null;
  private SchematicComponents: any = null;
  private loaded = false;

  async ngAfterViewInit(): Promise<void> {
    await this.loadReact();
    this.renderEmbed();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.loaded && (changes['accessToken'] || changes['componentId'])) {
      this.renderEmbed();
    }
  }

  ngOnDestroy(): void {
    if (this.root) {
      this.root.unmount();
      this.root = null;
    }
  }

  private async loadReact(): Promise<void> {
    try {
      this.React = await import('react');
      this.ReactDOM = await import('react-dom/client');
      this.SchematicComponents = await import(
        '@schematichq/schematic-components'
      );
      this.loaded = true;
    } catch (err) {
      console.error('Failed to load React dependencies for embed:', err);
    }
  }

  private renderEmbed(): void {
    if (
      !this.loaded ||
      !this.accessToken ||
      !this.componentId ||
      !this.container
    ) {
      return;
    }

    const { createElement } = this.React;
    const { EmbedProvider, SchematicEmbed } = this.SchematicComponents;

    const element = createElement(
      EmbedProvider,
      {},
      createElement(SchematicEmbed, {
        accessToken: this.accessToken,
        id: this.componentId,
      })
    );

    if (!this.root) {
      this.root = this.ReactDOM.createRoot(this.container.nativeElement);
    }
    this.root.render(element);
  }
}
