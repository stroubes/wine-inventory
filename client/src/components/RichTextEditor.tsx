import React, { useState, useRef } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = "Write your content here...",
  className = "",
  disabled = false
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  const handleFocus = () => setIsFocused(true);
  const handleBlur = () => setIsFocused(false);


  return (
    <div className={`border rounded-md ${isFocused ? 'ring-2 ring-wine-600 border-wine-600' : 'border-gray-300'} ${className}`}>

      {/* Editor */}
      <textarea
        ref={editorRef as any}
        value={value.replace(/<[^>]*>/g, '')}
        onChange={(e) => onChange(e.target.value)}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        dir="ltr"
        className={`p-3 w-full focus:outline-none resize-vertical ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
        style={{
          height: '200px',
          direction: 'ltr',
          textAlign: 'left',
          unicodeBidi: 'embed',
        }}
      />

    </div>
  );
};

export default RichTextEditor;