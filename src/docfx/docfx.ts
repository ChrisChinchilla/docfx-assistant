import { findFiles, readJson, readYaml, readYamlFrontMatter } from "./fs-utils";
import * as path from 'path';

/**
 * Represents the metadata for a DocFX topic.
 */
export interface TopicMetadata {
    /** The page UID. */
    uid: string;

    /** The page title. */
    name?: string;

    /** The page title. */
    title?: string;

    /** The source file where the topic is defined. */
    sourceFile: string;
}

/**
 * Get metadata for all topics defined in the specified project.
 * 
 * @param projectFile The full path to docfx.json.
 */
export async function getAllTopics(projectFile: string): Promise<TopicMetadata[]> {
    const contentFiles = await getProjectContentFiles(projectFile);

    let topicMetadata: TopicMetadata[] = [];
    for (const contentFile of contentFiles) {
        if (contentFile.endsWith('.json') || contentFile.endsWith('toc.yml'))
            continue; // We don't care about these files.

        if (contentFile.endsWith('.md'))
        {
            const conceptualTopicMetadata = await parseMarkdownTopicMetadata(contentFile);
            if (!conceptualTopicMetadata)
                continue;

            topicMetadata.push(conceptualTopicMetadata);
        } else if (contentFile.endsWith('.yml')) {
            const managedReferenceTopicsMetadata = await parseManagedReferenceYaml(contentFile);
            
            topicMetadata = topicMetadata.concat(managedReferenceTopicsMetadata);
        }
    }

    // Sorted by UID.
    topicMetadata.sort(
        (metadata1, metadata2) => metadata1.uid.localeCompare(metadata2.uid)
    );

    return topicMetadata;
}

/**
 * Parse page metadata from a Markdown file's YAML front-matter.
 * 
 * @param fileName The full path to the file.
 * @returns A promise that resolves to the page metadata (or null if the page metadata could not be parsed).
 */
async function parseMarkdownTopicMetadata(fileName: string): Promise<TopicMetadata> {
    const topicMetadata = await readYamlFrontMatter<TopicMetadata>(fileName);
    if (!topicMetadata)
        return null;

    if (!topicMetadata.uid)
        return null;

    topicMetadata.name == topicMetadata.name || topicMetadata.uid;
    topicMetadata.title = topicMetadata.title || topicMetadata.name;
    topicMetadata.sourceFile = fileName;

    return topicMetadata;
}

/** The root of a DocFX managed reference document. */
interface ManagedReferenceRoot {
    /** The managed reference items. */
    items: ManagedReferenceMetadata[];
}

/** The metadata for a DocFX managed reference. */
interface ManagedReferenceMetadata {
    /** The reference UID. */
    uid: string;

    /** The reference type (e.g. Namespace, Class, Method, etc). */
    type: string;

    /** The reference name. */
    name: string;

    /** The reference name, including enclosing CLR type. */
    nameWithType: string;

    /** The fully-qualified reference name, including enclosing namespace. */
    fullName: string;

    /** The Id of the XML doc comment from which the managed reference was extracted. */
    commentId: string;
}

/**
 * Parse page metadata from DocFX managed-class-reference YAML.
 * @param fileName 
 */
async function parseManagedReferenceYaml(fileName: string): Promise<TopicMetadata[]> {
    const topicMetadata: TopicMetadata[] = [];

    const mrefYaml = await readYaml<ManagedReferenceRoot>(fileName,
        'ManagedReference' // Expected YAML MIME type.
    );
    if (!mrefYaml || !mrefYaml.items)
        return topicMetadata;

    for (const managedReference of mrefYaml.items) {
        if (!managedReference.uid)
            continue;

        topicMetadata.push({
            uid: managedReference.uid,
            name:managedReference.fullName,
            title: managedReference.nameWithType,
            sourceFile: fileName
        });
    }

    return topicMetadata;
}

/**
 * Get all content files defined in the DocFX project.
 * 
 * @param projectFile The full path to docfx.json.
 * @returns A promise resolving as an array of content file names.
 */
export async function getProjectContentFiles(projectFile: string): Promise<string[]> {
    const project: any = await readJson(projectFile);

    let files: string[] = [];
    const baseDir = path.dirname(projectFile);
    const patterns: string[] = [];
    for (const contentEntry of project.build.content) {
        if (!contentEntry.files)
            continue;

        const entryBaseDirectory = path.join(baseDir, contentEntry.src || '');
        const entryPatterns = contentEntry.files.filter(
            pattern => !pattern.endsWith('.json') // Ignore Swagger files
        );
        if (!entryPatterns.length)
            continue;

        files = files.concat(
            await getFiles(entryBaseDirectory, ...entryPatterns)
        );
    }

    return files;
}

/**
 * Get all files that match the specified globbing pattern.
 * 
 * @param baseDirectory The base directory (patterns are considered relative to this).
 * @param globPatterns One or more globbing patterns to match.
 * @returns A promise resolving as an array of matching file names.
 */
async function getFiles(baseDirectory: string, ...globPatterns: string[]): Promise<string[]> {
    const scanners: Promise<string[]>[] = [];
    for (const globPattern of globPatterns) {
        scanners.push(
            findFiles(baseDirectory, globPattern)
        );
    }
    
    let files: string[] = [];
    for (const scanResult of await Promise.all(scanners)) {
        files = files.concat(scanResult);
    }

    return files;
}
