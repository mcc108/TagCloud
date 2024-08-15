export interface TagCloud {
    update(texts: Array<string>): void;
    pause(): void;
    resume(): void;
    destroy(): void;
}

export interface TagCloudOptions {
    radius?: number;
    maxSpeed?: "slow" | "normal" | "fast";
    initSpeed?: "slow" | "normal" | "fast";
    deceleration?: number;
    keep?: boolean;
    containerClass?: string;
    itemClass?: string;
    useContainerInlineStyles?: boolean;
    useItemInlineStyles?: boolean;
    useHTML?: boolean;
}

export interface TagEntity {
    text: string;
    color: string
}

export default function (
    container: string,
    texts: Array<string> | Array<TagEntity>,
    options?: TagCloudOptions
): TagCloud;

export default function (
    container: Element,
    texts: Array<string> | Array<TagEntity>,
    options?: TagCloudOptions
): TagCloud;

export default function (
    container: [Element],
    texts: Array<string> | Array<TagEntity>,
    options?: TagCloudOptions
): TagCloud;

export default function (
    container: Array<Element>,
    texts: Array<string> | Array<TagEntity>,
    options?: TagCloudOptions
): Array<TagCloud> | TagCloud;
