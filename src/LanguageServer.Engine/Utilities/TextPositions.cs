using System;
using System.Collections.Generic;

namespace DocFXAssistant.LanguageServer.Utilities
{
    /// <summary>
    ///     A quick-and-dirty calculator for text positions.
    /// </summary>
    /// <remarks>
    ///     This could easily be improved by also storing a character sub-total for each line.
    /// </remarks>
    public sealed class TextPositions
    {
        /// <summary>
        ///     The absolution starting position, within the text, of each line.
        /// </summary>
        readonly int[] _lineStartPositions;

        /// <summary>
        ///     Create a new <see cref="TextPositions"/> for the specified text.
        /// </summary>
        /// <param name="text">
        ///     The text.
        /// </param>
        public TextPositions(string text)
        {
            if (text == null)
                throw new ArgumentNullException(nameof(text));

            _lineStartPositions = CalculateLineStartPositions(text);
        }

        /// <summary>
        ///     The number of lines in the text.
        /// </summary>
        public int LineCount => _lineStartPositions.Length;

        /// <summary>
        ///     The absolution starting position, within the text, of each line.
        /// </summary>
        public IReadOnlyList<int> LineStartPositions => _lineStartPositions;

        /// <summary>
        ///     Convert a <see cref="Position"/> to an absolute position within the text.
        /// </summary>
        /// <param name="position">
        ///     The target <see cref="Position"/> (0-based or 1-based).
        /// </param>
        /// <returns>
        ///     The equivalent absolute position (0-based) within the text.
        /// </returns>
        public int GetAbsolutePosition(Position position)
        {
            if (position == null)
                throw new ArgumentNullException(nameof(position));

            position = position.ToZeroBased();

            return GetAbsolutePosition(position.LineNumber, position.ColumnNumber);
        }

        /// <summary>
        ///     Convert line and column numbers to an absolute position within the text.
        /// </summary>
        /// <param name="line">
        ///     The target line (0-based).
        /// </param>
        /// <param name="column">
        ///     The target column (0-based).
        /// </param>
        /// <returns>
        ///     The equivalent absolute position within the text.
        /// </returns>
        public int GetAbsolutePosition(int line, int column)
        {
            if (line < 0)
                throw new ArgumentOutOfRangeException(nameof(line), line, "Line cannot be less than 0.");

            if (line >= _lineStartPositions.Length)
                throw new ArgumentOutOfRangeException(nameof(line), line, "Line is past the end of the text.");

            if (column < 0)
                throw new ArgumentOutOfRangeException(nameof(column), column, "Column cannot be less than 0.");

            return _lineStartPositions[line] + column;
        }

        /// <summary>
        ///     Convert an absolute position to a line and column in the text.
        /// </summary>
        /// <param name="absolutePosition">
        ///     The absolute position (0-based).
        /// </param>
        /// <returns>
        ///     The equivalent <see cref="Position"/> within the text.
        /// </returns>
        public Position GetPosition(int absolutePosition)
        {
            int targetLine = Array.BinarySearch(_lineStartPositions, absolutePosition);
            if (targetLine < 0)
                targetLine = ~targetLine - 1; // No match, so BinarySearch returns 2's complement of the following line index.

            // Internally, we're 0-based, but lines and columns are (by convention) 1-based.
            return Position.FromZeroBased(
                lineNumber: targetLine,
                columnNumber: absolutePosition - _lineStartPositions[targetLine]
            ).ToOneBased();
        }

        /// <summary>
        ///     Calculate the start position for each line in the text.
        /// </summary>
        /// <param name="text">
        ///     The text to scan.
        /// </param>
        /// <returns>
        ///     An array of line starting positions.
        /// </returns>
        int[] CalculateLineStartPositions(string text)
        {
            if (text == null)
                throw new ArgumentNullException(nameof(text));

            List<int> lineStarts = new List<int>();

            int currentPosition = 0;
            int currentLineStart = 0;
            while (currentPosition < text.Length)
            {
                char currentChar = text[currentPosition];
                currentPosition++;

                switch (currentChar)
                {
                    case '\r':
                        {
                            if (currentPosition < text.Length && text[currentPosition] == '\n')
                                currentPosition++;

                            goto case '\n';
                        }
                    case '\n':
                        {
                            lineStarts.Add(currentLineStart);
                            currentLineStart = currentPosition;

                            break;
                        }
                }
            }
            lineStarts.Add(currentLineStart);

            return lineStarts.ToArray();
        }
    }
}
