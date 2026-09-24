import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format, isToday } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronRight, FileText, Plus, Search, Trash2 } from "lucide-react";
import {
  pagesApi,
  useBlocks,
  useCreateBlock,
  useCreatePage,
  useDeleteBlock,
  useDeletePage,
  useUpdateBlock,
  useUpdatePage,
  usePages,
} from "@doit/core-data";
import type { Block, BlockContent, BlockType, Page } from "@doit/core-data";
import { IconButton } from "@doit/design-system";
import "./pages.css";

interface PageNode extends Page {
  children: PageNode[];
}

function buildTree(pages: Page[]): PageNode[] {
  const byId = new Map<string, PageNode>();
  pages.forEach((p) => byId.set(p.id, { ...p, children: [] }));
  const roots: PageNode[] = [];
  byId.forEach((node) => {
    const parent = node.parentPageId ? byId.get(node.parentPageId) : undefined;
    if (parent) parent.children.push(node);
    else roots.push(node);
  });
  const sortRec = (nodes: PageNode[]) => {
    nodes.sort((a, b) => a.sortOrder - b.sortOrder);
    nodes.forEach((n) => sortRec(n.children));
  };
  sortRec(roots);
  return roots;
}

const DEFAULT_CONTENT: Record<BlockType, BlockContent> = {
  paragraph: { text: "" },
  heading: { text: "" },
  todo: { text: "", checked: false },
  bulleted_list_item: { text: "" },
  page_link: {},
};

export function PagesPage() {
  const { pageId } = useParams<{ pageId?: string }>();
  const navigate = useNavigate();
  const { data: pages } = usePages();
  const createPage = useCreatePage();
  const updatePage = useUpdatePage();
  const deletePage = useDeletePage();

  const [search, setSearch] = useState("");
  const tree = useMemo(() => buildTree(pages ?? []), [pages]);
  const searchResults = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return null;
    return (pages ?? [])
      .filter((p) => p.title.toLowerCase().includes(q) || p.preview?.toLowerCase().includes(q))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [pages, search]);
  const selectedId = pageId ?? null;
  const selectedPage = pages?.find((p) => p.id === selectedId) ?? null;

  const { data: blocks } = useBlocks(selectedId);
  const createBlock = useCreateBlock(selectedId ?? "");
  const updateBlock = useUpdateBlock(selectedId ?? "");
  const deleteBlock = useDeleteBlock(selectedId ?? "");

  const { data: backlinkIds } = useQuery({
    queryKey: ["backlinks", selectedId],
    queryFn: () => pagesApi.listBacklinks(selectedId as string),
    enabled: !!selectedId,
  });
  const backlinkPages = (pages ?? []).filter((p) => backlinkIds?.includes(p.id));

  async function handleNewPage(parentPageId?: string) {
    const page = await createPage.mutateAsync({ title: "Sin título", parentPageId });
    navigate(`/pages/${page.id}`);
  }

  function addBlock(type: BlockType) {
    if (!selectedId) return;
    createBlock.mutate({ blockType: type, content: DEFAULT_CONTENT[type] });
  }

  async function setPageLinkTarget(block: Block, targetPageId: string) {
    updateBlock.mutate({ id: block.id, patch: { content: { targetPageId } } });
    if (selectedId && targetPageId) {
      await pagesApi.createLink(selectedId, targetPageId, block.id);
    }
  }

  return (
    <div className="pages-page">
      <aside className="pages-tree">
        <div className="pages-tree-header">
          <span>Páginas</span>
          <IconButton onClick={() => handleNewPage()} aria-label="Nueva página">
            <Plus size={16} />
          </IconButton>
        </div>
        <div className="pages-search">
          <Search size={14} />
          <input
            placeholder="Buscar…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="pages-tree-list">
          {searchResults
            ? searchResults.map((p) => (
                <NoteRow
                  key={p.id}
                  page={p}
                  active={selectedId === p.id}
                  onSelect={() => navigate(`/pages/${p.id}`)}
                />
              ))
            : tree.map((node) => (
                <PageTreeNode
                  key={node.id}
                  node={node}
                  depth={0}
                  selectedId={selectedId}
                  onSelect={(id) => navigate(`/pages/${id}`)}
                  onAddChild={handleNewPage}
                  onDelete={(id) => deletePage.mutate(id)}
                />
              ))}
        </div>
      </aside>

      <section className="pages-editor">
        {!selectedPage && <p className="pages-empty">Elegí o creá una página para empezar.</p>}
        {selectedPage && (
          <>
            <input
              className="pages-title-input"
              value={selectedPage.title}
              onChange={(e) => updatePage.mutate({ id: selectedPage.id, patch: { title: e.target.value } })}
              placeholder="Sin título"
            />

            <div className="pages-blocks">
              {(blocks ?? []).map((block) => (
                <BlockRow
                  key={block.id}
                  block={block}
                  allPages={pages ?? []}
                  onCommit={(content) => updateBlock.mutate({ id: block.id, patch: { content } })}
                  onSetLinkTarget={(targetId) => setPageLinkTarget(block, targetId)}
                  onDelete={() => deleteBlock.mutate(block.id)}
                />
              ))}
            </div>

            <div className="pages-add-block">
              <button onClick={() => addBlock("paragraph")}>Texto</button>
              <button onClick={() => addBlock("heading")}>Título</button>
              <button onClick={() => addBlock("todo")}>Tarea</button>
              <button onClick={() => addBlock("bulleted_list_item")}>Lista</button>
              <button onClick={() => addBlock("page_link")}>Vincular página</button>
            </div>

            {backlinkPages.length > 0 && (
              <div className="pages-backlinks">
                <span className="pages-backlinks-title">Mencionada en</span>
                {backlinkPages.map((p) => (
                  <button key={p.id} className="pages-backlink" onClick={() => navigate(`/pages/${p.id}`)}>
                    <FileText size={14} /> {p.title || "Sin título"}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}

function PageTreeNode({
  node,
  depth,
  selectedId,
  onSelect,
  onAddChild,
  onDelete,
}: {
  node: PageNode;
  depth: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAddChild: (parentId: string) => void;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children.length > 0;

  return (
    <div>
      <div
        className={`pages-tree-row ${selectedId === node.id ? "active" : ""}`}
        style={{ paddingLeft: 8 + depth * 16 }}
        onClick={() => onSelect(node.id)}
      >
        <span
          className={`pages-tree-caret ${hasChildren ? "" : "invisible"}`}
          onClick={(e) => {
            e.stopPropagation();
            setExpanded((v) => !v);
          }}
        >
          <ChevronRight size={13} style={{ transform: expanded ? "rotate(90deg)" : "none" }} />
        </span>
        <FileText size={14} className="pages-tree-icon" />
        <div className="pages-tree-lines">
          <span className="pages-tree-title">{node.title || "Sin título"}</span>
          {node.preview && <span className="pages-tree-preview">{node.preview}</span>}
        </div>
        <span className="pages-tree-date">{formatNoteDate(node.updatedAt)}</span>
        <span className="pages-tree-actions">
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              onAddChild(node.id);
            }}
            aria-label="Agregar subpágina"
          >
            <Plus size={13} />
          </IconButton>
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              onDelete(node.id);
            }}
            aria-label="Borrar página"
          >
            <Trash2 size={13} />
          </IconButton>
        </span>
      </div>
      {expanded &&
        node.children.map((child) => (
          <PageTreeNode
            key={child.id}
            node={child}
            depth={depth + 1}
            selectedId={selectedId}
            onSelect={onSelect}
            onAddChild={onAddChild}
            onDelete={onDelete}
          />
        ))}
    </div>
  );
}

function formatNoteDate(iso: string) {
  const date = new Date(iso);
  return isToday(date) ? format(date, "HH:mm") : format(date, "d MMM", { locale: es });
}

function NoteRow({
  page,
  active,
  onSelect,
}: {
  page: Page;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <div className={`pages-tree-row ${active ? "active" : ""}`} style={{ paddingLeft: 8 }} onClick={onSelect}>
      <FileText size={14} className="pages-tree-icon" />
      <div className="pages-tree-lines">
        <span className="pages-tree-title">{page.title || "Sin título"}</span>
        {page.preview && <span className="pages-tree-preview">{page.preview}</span>}
      </div>
      <span className="pages-tree-date">{formatNoteDate(page.updatedAt)}</span>
    </div>
  );
}

function BlockRow({
  block,
  allPages,
  onCommit,
  onSetLinkTarget,
  onDelete,
}: {
  block: Block;
  allPages: Page[];
  onCommit: (content: BlockContent) => void;
  onSetLinkTarget: (targetPageId: string) => void;
  onDelete: () => void;
}) {
  const [text, setText] = useState(block.content.text ?? "");

  useEffect(() => {
    setText(block.content.text ?? "");
  }, [block.id]);

  const commitText = () => onCommit({ ...block.content, text });

  const row = (() => {
    switch (block.type) {
      case "heading":
        return (
          <input
            className="pages-block-heading"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onBlur={commitText}
            placeholder="Título"
          />
        );
      case "todo":
        return (
          <label className="pages-block-todo">
            <input
              type="checkbox"
              checked={!!block.content.checked}
              onChange={(e) => onCommit({ ...block.content, checked: e.target.checked })}
            />
            <input
              className="pages-block-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onBlur={commitText}
              placeholder="Tarea"
            />
          </label>
        );
      case "bulleted_list_item":
        return (
          <div className="pages-block-bullet">
            <span>•</span>
            <input
              className="pages-block-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onBlur={commitText}
              placeholder="Ítem de lista"
            />
          </div>
        );
      case "page_link":
        return (
          <select
            className="pages-block-link"
            value={block.content.targetPageId ?? ""}
            onChange={(e) => onSetLinkTarget(e.target.value)}
          >
            <option value="">Elegí una página…</option>
            {allPages.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title || "Sin título"}
              </option>
            ))}
          </select>
        );
      default:
        return (
          <textarea
            className="pages-block-text pages-block-paragraph"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onBlur={commitText}
            placeholder="Escribí algo…"
            rows={1}
          />
        );
    }
  })();

  return (
    <div className="pages-block-row">
      {row}
      <IconButton onClick={onDelete} aria-label="Borrar bloque" className="pages-block-delete">
        <Trash2 size={13} />
      </IconButton>
    </div>
  );
}
