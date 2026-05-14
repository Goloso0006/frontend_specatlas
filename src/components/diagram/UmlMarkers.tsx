// Markers rendering

export function UmlMarkers() {
  return (
    <svg style={{ position: 'absolute', width: 0, height: 0 }}>
      <defs>
        {/* Inheritance / Implementation: Empty Triangle (triangle-empty) */}
        <marker
          id="triangle-empty"
          markerWidth="12"
          markerHeight="12"
          refX="11"
          refY="6"
          orient="auto"
          markerUnits="userSpaceOnUse"
        >
          <path
            d="M0,0 L12,6 L0,12 Z"
            fill="white"
            stroke="currentColor"
            strokeWidth="1.5"
          />
        </marker>

        {/* Dependency: Open Arrow (open-arrow) */}
        <marker
          id="open-arrow"
          markerWidth="10"
          markerHeight="10"
          refX="9"
          refY="5"
          orient="auto"
          markerUnits="userSpaceOnUse"
        >
          <path
            d="M0,0 L10,5 L0,10"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          />
        </marker>

        {/* Aggregation: Empty Diamond (diamond-empty) */}
        <marker
          id="diamond-empty"
          markerWidth="16"
          markerHeight="16"
          refX="0"
          refY="8"
          orient="auto"
          markerUnits="userSpaceOnUse"
        >
          <path
            d="M0,8 L8,0 L16,8 L8,16 Z"
            fill="white"
            stroke="currentColor"
            strokeWidth="1.5"
          />
        </marker>

        {/* Composition: Filled Diamond (diamond-filled) */}
        <marker
          id="diamond-filled"
          markerWidth="16"
          markerHeight="16"
          refX="0"
          refY="8"
          orient="auto"
          markerUnits="userSpaceOnUse"
        >
          <path
            d="M0,8 L8,0 L16,8 L8,16 Z"
            fill="currentColor"
            stroke="currentColor"
            strokeWidth="1.5"
          />
        </marker>

        {/* Compatibility aliases */}
        <marker id="uml-inheritance-arrow" refX="11" refY="6" orient="auto" markerWidth="12" markerHeight="12" markerUnits="userSpaceOnUse">
          <use href="#triangle-empty" />
        </marker>
        <marker id="uml-dependency-arrow" refX="9" refY="5" orient="auto" markerWidth="10" markerHeight="10" markerUnits="userSpaceOnUse">
          <use href="#open-arrow" />
        </marker>
        <marker id="uml-aggregation-diamond" refX="0" refY="8" orient="auto" markerWidth="16" markerHeight="16" markerUnits="userSpaceOnUse">
          <use href="#diamond-empty" />
        </marker>
        <marker id="uml-composition-diamond" refX="0" refY="8" orient="auto" markerWidth="16" markerHeight="16" markerUnits="userSpaceOnUse">
          <use href="#diamond-filled" />
        </marker>
      </defs>
    </svg>
  )
}

