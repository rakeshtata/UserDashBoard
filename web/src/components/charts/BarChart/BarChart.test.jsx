import React from 'react';
import { render } from '@testing-library/react';
import BarChart from './index';
import draw from './vis';

jest.mock('./vis', () => jest.fn());

describe('BarChart Component', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders the chart container element', () => {
    const { container } = render(<BarChart data={[]} />);
    const chartDiv = container.querySelector('.vis-barchart');
    expect(chartDiv).toBeInTheDocument();
  });

  it('calls the draw function with provided props on mount', () => {
    const props = { data: [{ x: 1, y: 2 }] };
    render(<BarChart {...props} />);
    expect(draw).toHaveBeenCalledWith(props);
  });
});
