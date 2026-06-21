import { useEffect, useState, useRef } from "react";
import {
  Palette as PaletteIcon,
  ChevronDown as ChevronDownIcon,
  Plus as PlusIcon,
  Edit as EditIcon,
  Trash2 as TrashIcon,
  Check as CheckIcon,
  X as XIcon,
  ToggleLeft as ToggleOffIcon,
  ToggleRight as ToggleOnIcon,
} from "lucide-react";

const DEFAULT_STYLE_TEMPLATES = [
  {
    id: "cyberpunk",
    name: "赛博朋克",
    prefix: "cyberpunk style, neon lights, dark atmosphere, high contrast, futuristic",
    color: "#ff00ff",
  },
  {
    id: "watercolor",
    name: "水彩风",
    prefix: "watercolor painting style, soft edges, blended colors, artistic, flowing brushstrokes",
    color: "#4fc3f7",
  },
  {
    id: "sketch",
    name: "素描风",
    prefix: "pencil sketch style, hand-drawn, monochrome, detailed shading, graphite texture",
    color: "#757575",
  },
  {
    id: "3d-render",
    name: "3D渲染",
    prefix: "3D render, octane render, photorealistic, cinematic lighting, high detail, 8k",
    color: "#ff9800",
  },
];

const STORAGE_KEY = "scribble_style_templates";
const SELECTED_KEY = "scribble_selected_style";
const ENABLED_KEY = "scribble_style_enabled";

export default function PromptForm({
  initialPrompt,
  onSubmit,
  scribbleExists,
  onPromptChange,
}) {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [styleEnabled, setStyleEnabled] = useState(true);
  const [showTemplateMenu, setShowTemplateMenu] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", prefix: "", color: "#3b82f6" });
  const [isNewTemplate, setIsNewTemplate] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setTemplates(JSON.parse(saved));
      } catch {
        setTemplates(DEFAULT_STYLE_TEMPLATES);
      }
    } else {
      setTemplates(DEFAULT_STYLE_TEMPLATES);
    }

    const savedSelected = localStorage.getItem(SELECTED_KEY);
    if (savedSelected) {
      setSelectedTemplate(savedSelected);
    }

    const savedEnabled = localStorage.getItem(ENABLED_KEY);
    if (savedEnabled !== null) {
      setStyleEnabled(savedEnabled === "true");
    }
  }, []);

  useEffect(() => {
    setPrompt(initialPrompt);
  }, [initialPrompt]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowTemplateMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const saveTemplates = (newTemplates) => {
    setTemplates(newTemplates);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newTemplates));
  };

  const selectTemplate = (templateId) => {
    setSelectedTemplate(templateId);
    localStorage.setItem(SELECTED_KEY, templateId);
    setShowTemplateMenu(false);
  };

  const toggleStyle = () => {
    const newValue = !styleEnabled;
    setStyleEnabled(newValue);
    localStorage.setItem(ENABLED_KEY, String(newValue));
  };

  const getFullPrompt = () => {
    if (!styleEnabled || !selectedTemplate) return prompt;
    const template = templates.find((t) => t.id === selectedTemplate);
    if (!template) return prompt;
    return `${template.prefix}, ${prompt}`;
  };

  const currentTemplate = templates.find((t) => t.id === selectedTemplate);

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    formData.set("prompt", getFullPrompt());
    formData.set("rawPrompt", prompt);
    formData.set("stylePrefix", styleEnabled && currentTemplate ? currentTemplate.prefix : "");
    formData.set("styleName", styleEnabled && currentTemplate ? currentTemplate.name : "");
    formData.set("styleEnabled", String(styleEnabled));

    const newEvent = {
      ...e,
      target: {
        ...e.target,
        prompt: { value: getFullPrompt() },
        rawPrompt: { value: prompt },
        stylePrefix: { value: styleEnabled && currentTemplate ? currentTemplate.prefix : "" },
        styleName: { value: styleEnabled && currentTemplate ? currentTemplate.name : "" },
        styleEnabled: { value: String(styleEnabled) },
      },
    };
    onSubmit(newEvent);
  };

  const startNewTemplate = () => {
    setIsNewTemplate(true);
    setEditingTemplate({ id: Date.now().toString() });
    setEditForm({ name: "新风格", prefix: "", color: "#3b82f6" });
  };

  const startEditTemplate = (template) => {
    setIsNewTemplate(false);
    setEditingTemplate(template);
    setEditForm({
      name: template.name,
      prefix: template.prefix,
      color: template.color || "#3b82f6",
    });
  };

  const cancelEdit = () => {
    setEditingTemplate(null);
    setEditForm({ name: "", prefix: "", color: "#3b82f6" });
  };

  const saveTemplate = () => {
    if (!editForm.name.trim() || !editForm.prefix.trim()) return;

    if (isNewTemplate) {
      const newTemplate = {
        ...editingTemplate,
        name: editForm.name.trim(),
        prefix: editForm.prefix.trim(),
        color: editForm.color,
      };
      saveTemplates([...templates, newTemplate]);
    } else {
      saveTemplates(
        templates.map((t) =>
          t.id === editingTemplate.id
            ? { ...t, name: editForm.name.trim(), prefix: editForm.prefix.trim(), color: editForm.color }
            : t
        )
      );
    }
    cancelEdit();
  };

  const deleteTemplate = (templateId) => {
    if (!confirm("确定删除这个风格模板吗？")) return;
    saveTemplates(templates.filter((t) => t.id !== templateId));
    if (selectedTemplate === templateId) {
      setSelectedTemplate(null);
      localStorage.removeItem(SELECTED_KEY);
    }
  };

  const disabled = !(scribbleExists && prompt?.length > 0);

  return (
    <form
      onSubmit={handleSubmit}
      className="animate-in fade-in duration-700"
      ref={menuRef}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="relative flex-1">
          <button
            type="button"
            className={`flex items-center gap-2 px-3 py-2 border rounded-md text-sm transition-colors w-full ${
              styleEnabled && currentTemplate
                ? "border-gray-300 bg-white hover:bg-gray-50"
                : "border-gray-200 bg-gray-50 text-gray-500"
            }`}
            onClick={() => setShowTemplateMenu(!showTemplateMenu)}
          >
            <PaletteIcon className="w-4 h-4" />
            {styleEnabled && currentTemplate ? (
              <>
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: currentTemplate.color }}
                />
                <span className="font-medium">{currentTemplate.name}</span>
              </>
            ) : (
              <span>选择风格模板</span>
            )}
            <ChevronDownIcon className="w-4 h-4 opacity-50 ml-auto" />
          </button>

          {showTemplateMenu && !editingTemplate && (
            <div className="absolute top-full left-0 mt-1 w-72 bg-white border border-gray-200 rounded-md shadow-lg z-20 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="p-2 border-b border-gray-100 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">风格模板</span>
                <button
                  type="button"
                  onClick={startNewTemplate}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                  title="新建模板"
                >
                  <PlusIcon className="w-4 h-4" />
                </button>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {templates.map((template) => {
                  const isSelected = selectedTemplate === template.id;
                  return (
                    <div
                      key={template.id}
                      className={`flex items-center gap-3 px-3 py-2 hover:bg-gray-50 transition-colors ${
                        isSelected ? "bg-gray-100" : ""
                      }`}
                    >
                      <button
                        type="button"
                        className="flex-1 flex items-center gap-2 text-left"
                        onClick={() => selectTemplate(template.id)}
                      >
                        <span
                          className="w-4 h-4 rounded-full flex-shrink-0"
                          style={{ backgroundColor: template.color }}
                        />
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">{template.name}</div>
                          <div className="text-xs text-gray-500 truncate">{template.prefix}</div>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => startEditTemplate(template)}
                        className="p-1 hover:bg-gray-200 rounded transition-colors opacity-0 hover:opacity-100 group-hover:opacity-100"
                        title="编辑"
                      >
                        <EditIcon className="w-3.5 h-3.5 text-gray-500" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteTemplate(template.id)}
                        className="p-1 hover:bg-red-100 rounded transition-colors opacity-0 hover:opacity-100 group-hover:opacity-100"
                        title="删除"
                      >
                        <TrashIcon className="w-3.5 h-3.5 text-red-500" />
                      </button>
                      {isSelected && (
                        <CheckIcon className="w-4 h-4 text-black" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {editingTemplate && (
            <div className="absolute top-full left-0 mt-1 w-80 bg-white border border-gray-200 rounded-md shadow-lg z-20 p-3 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="text-sm font-medium mb-3">
                {isNewTemplate ? "新建风格模板" : "编辑风格模板"}
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">模板名称</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) =>
                      setEditForm({ ...editForm, name: e.target.value })
                    }
                    placeholder="例如：赛博朋克"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">风格前缀</label>
                  <textarea
                    value={editForm.prefix}
                    onChange={(e) =>
                      setEditForm({ ...editForm, prefix: e.target.value })
                    }
                    placeholder="例如：cyberpunk style, neon lights"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">标识颜色</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={editForm.color}
                      onChange={(e) =>
                        setEditForm({ ...editForm, color: e.target.value })
                      }
                      className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
                    />
                    <span className="text-xs text-gray-500">{editForm.color}</span>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <XIcon className="w-4 h-4 inline mr-1" />
                  取消
                </button>
                <button
                  type="button"
                  onClick={saveTemplate}
                  className="px-3 py-1.5 text-sm text-white bg-black rounded-md hover:bg-gray-800 transition-colors"
                >
                  <CheckIcon className="w-4 h-4 inline mr-1" />
                  保存
                </button>
              </div>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={toggleStyle}
          className={`p-2 rounded-md transition-colors ${
            styleEnabled
              ? "bg-gray-100 hover:bg-gray-200"
              : "bg-gray-50 hover:bg-gray-100"
          }`}
          title={styleEnabled ? "关闭风格模板" : "启用风格模板"}
        >
          {styleEnabled ? (
            <ToggleOnIcon className="w-5 h-5 text-black" />
          ) : (
            <ToggleOffIcon className="w-5 h-5 text-gray-400" />
          )}
        </button>
      </div>

      {styleEnabled && currentTemplate && (
        <div className="text-xs text-gray-500 mb-2 px-1 truncate">
          风格前缀：<span className="text-gray-700">{currentTemplate.prefix}</span>
        </div>
      )}

      <div className="flex mt-2">
        <input
          id="prompt-input"
          type="text"
          name="prompt"
          value={prompt}
          onChange={(e) => {
            setPrompt(e.target.value);
            if (onPromptChange) onPromptChange(e.target.value);
          }}
          placeholder="Describe the image you want to create..."
          className="block w-full flex-grow rounded-l-md"
        />

        <button
          className={`bg-black text-white rounded-r-md text-small inline-block px-5 py-3 flex-none ${
            disabled ? "opacity-20 cursor-not-allowed	" : ""
          }`}
          type="submit"
          disabled={disabled}
        >
          Go
        </button>
      </div>
    </form>
  );
}
