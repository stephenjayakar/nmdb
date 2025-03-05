import React, { useState, forwardRef, useImperativeHandle } from "react";
import { Form, InputGroup, Button } from "react-bootstrap";

const SearchBarDatePicker = forwardRef(({ onSearch, onDateChange }, ref) => {
  const [searchText, setSearchText] = useState("");
  const [date, setDate] = useState("");

  // Expose a clear method so the parent can clear the search bar.
  useImperativeHandle(ref, () => ({
    clearSearch: () => {
      setSearchText("");
    },
  }));

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchText(value);
    if (onSearch) {
      onSearch(value);
    }
  };

  const handleDateChange = (e) => {
    const selectedDate = e.target.value;
    setDate(selectedDate);
    // Clear search text when a date is selected
    setSearchText("");
    if (onDateChange) {
      onDateChange(selectedDate);
    }
  };

  return (
    <div className="d-flex align-items-center mb-3">
      <InputGroup className="me-3">
        <Form.Control
          type="text"
          placeholder="Search messages..."
          value={searchText}
          onChange={handleSearchChange}
        />
        <Button
          variant="primary"
          onClick={() => onSearch && onSearch(searchText)}
        >
          Search
        </Button>
      </InputGroup>
      <Form.Control
        type="date"
        value={date}
        onChange={handleDateChange}
      />
    </div>
  );
});

export default SearchBarDatePicker;
