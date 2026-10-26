// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { StrictMode } from 'react';
import { useImageUpload } from 'react_free_upload';
import { ImageUploader } from '../registry/image-uploader/image-uploader';
import type { UploadedImage } from 'react_free_upload-core';
afterEach(cleanup);
const file = new File(['image'], 'picture.png', { type: 'image/png' });
const old = { path: 'old-path', url: '/old.png' }, next = { path: 'new-path', url: '/new.png' };
describe('React integration and editable UI', () => {
  it('updates form state from completion and reports replacement', async () => {
    const complete = vi.fn(), replace = vi.fn();
    const { result } = renderHook(() => useImageUpload({ transport: async () => next, defaultValue: old, onUploadComplete: complete, onReplace: replace }));
    await act(() => result.current.upload(file));
    expect(result.current.field.value).toBe(next.path); expect(result.current.result).toEqual(next);
    expect(complete).toHaveBeenCalledExactlyOnceWith(next); expect(replace).toHaveBeenCalledTimes(1);
  });
  it('reflects controlled values and external resets', async () => {
    const transport = async () => next, change = vi.fn();
    const { result, rerender } = renderHook(({ value }: { value: UploadedImage | null }) => useImageUpload({ value, transport, onChange: change }), { initialProps: { value: old as UploadedImage | null } });
    await act(() => result.current.upload(file)); expect(result.current.field.value).toBe(old.path);
    rerender({ value: next }); expect(result.current.field.value).toBe(next.path);
    rerender({ value: null }); expect(result.current.result).toBeNull(); expect(result.current.field.value).toBe('');
  });
  it('invalidates pending results when the parent changes the displayed image', async () => {
    let resolve!: (value: UploadedImage) => void;
    const complete = vi.fn();
    const transport = () => new Promise<UploadedImage>(r => { resolve = r; });
    const { result, rerender } = renderHook(({ value }) => useImageUpload({ value, transport, onUploadComplete: complete }), { initialProps: { value: old } });
    let task!: Promise<UploadedImage | undefined>;
    act(() => { task = result.current.upload(file); });
    rerender({ value: { path: 'external', url: '/external.png' } });
    await act(async () => { resolve(next); await task; });
    expect(result.current.field.value).toBe('external'); expect(complete).not.toHaveBeenCalled();
  });
  it('preserves preview and hidden field on failure, then retries', async () => {
    const replace = vi.fn(); const transport = vi.fn().mockRejectedValueOnce(new Error('Try again')).mockResolvedValue(next);
    render(<ImageUploader transport={transport} defaultValue={old} onReplace={replace} label="Cover" />);
    fireEvent.change(screen.getByLabelText('Cover', { selector: 'input' }), { target: { files: [file] } });
    expect(await screen.findByRole('alert')).toHaveTextContent('Try again');
    expect(screen.getByRole('img')).toHaveAttribute('src', old.url); expect(document.querySelector('input[type=hidden]')).toHaveValue(old.path); expect(replace).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Retry upload' }));
    await waitFor(() => expect(screen.getByRole('img')).toHaveAttribute('src', next.url)); expect(replace).toHaveBeenCalledTimes(1);
  });
  it('provides accessible uploading and cancellation states', async () => {
    let resolve!: (value: UploadedImage) => void;
    render(<ImageUploader defaultValue={old} label="Cover" transport={() => new Promise(r => { resolve = r; })} />);
    fireEvent.change(screen.getByLabelText('Cover', { selector: 'input' }), { target: { files: [file] } });
    expect(screen.getByRole('progressbar', { name: 'Upload progress' })).toBeInTheDocument(); expect(screen.getByRole('img')).toHaveAttribute('src', old.url);
    fireEvent.click(screen.getByRole('button', { name: 'Cancel upload' }));
    await act(async () => resolve(next)); expect(screen.getByRole('status')).toHaveTextContent('Upload cancelled'); expect(screen.getByRole('img')).toHaveAttribute('src', old.url);
  });
  it('supports drag/drop and cleans object URLs after completion and unmount', async () => {
    const create = vi.fn(() => 'blob:preview'), revoke = vi.fn();
    vi.stubGlobal('URL', Object.assign(URL, { createObjectURL: create, revokeObjectURL: revoke }));
    let resolve!: (value: UploadedImage) => void;
    const { unmount } = render(<ImageUploader transport={() => new Promise(r => { resolve = r; })} />);
    fireEvent.drop(screen.getByText(/Drop one image/).parentElement!, { dataTransfer: { files: [file] } });
    expect(create).toHaveBeenCalledWith(file); await act(async () => resolve(next));
    expect(revoke).toHaveBeenCalledWith('blob:preview'); unmount();
  });
  it('keeps cancellation available when retrying a new image without a preview', async () => {
    vi.stubGlobal('URL', Object.assign(URL, { createObjectURL: vi.fn(() => 'blob:retry'), revokeObjectURL: vi.fn() }));
    let resolve!: (value: UploadedImage) => void;
    const transport = vi.fn().mockRejectedValueOnce(new Error('Retry this upload')).mockImplementationOnce(() => new Promise<UploadedImage>(r => { resolve = r; }));
    render(<ImageUploader transport={transport} />);
    fireEvent.change(screen.getByLabelText('Image', { selector: 'input' }), { target: { files: [file] } });
    await screen.findByRole('alert');
    fireEvent.click(screen.getByRole('button', { name: 'Retry upload' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel upload' }));
    await act(async () => resolve(next));
    expect(screen.getByRole('status')).toHaveTextContent('Upload cancelled');
    expect(document.querySelector('input[type=hidden]')).toHaveValue('');
  });
  it('keeps a newer preview when a cancelled upload resolves late', async () => {
    vi.stubGlobal('URL', Object.assign(URL, {
      createObjectURL: vi.fn().mockReturnValueOnce('blob:first').mockReturnValueOnce('blob:second'),
      revokeObjectURL: vi.fn(),
    }));
    let first!: (value: UploadedImage) => void;
    let second!: (value: UploadedImage) => void;
    const transport = vi.fn()
      .mockImplementationOnce(() => new Promise<UploadedImage>(resolve => { first = resolve; }))
      .mockImplementationOnce(() => new Promise<UploadedImage>(resolve => { second = resolve; }));
    render(<ImageUploader transport={transport} />);
    fireEvent.change(screen.getByLabelText('Image', { selector: 'input' }), { target: { files: [file] } });
    fireEvent.click(screen.getByRole('button', { name: 'Cancel upload' }));
    fireEvent.change(screen.getByLabelText('Image', { selector: 'input' }), { target: { files: [file] } });
    expect(screen.getByRole('img')).toHaveAttribute('src', 'blob:second');
    await act(async () => first({ path: 'obsolete', url: '/obsolete.png' }));
    expect(screen.getByRole('img')).toHaveAttribute('src', 'blob:second');
    await act(async () => second(next));
    expect(screen.getByRole('img')).toHaveAttribute('src', next.url);
  });
  it('rejects multiple dropped files and disabled selection', () => {
    const transport = vi.fn(); const { rerender } = render(<ImageUploader transport={transport} />);
    fireEvent.drop(screen.getByText(/Drop one image/).parentElement!, { dataTransfer: { files: [file, file] } });
    expect(screen.getByRole('alert')).toHaveTextContent('one image'); expect(transport).not.toHaveBeenCalled();
    rerender(<ImageUploader transport={transport} disabled />); expect(screen.getByLabelText('Image', { selector: 'input' })).toBeDisabled();
  });
  it('works under StrictMode and cancels on unmount without callbacks', async () => {
    let resolve!: (value: UploadedImage) => void; const callback = vi.fn();
    const { result, unmount } = renderHook(() => useImageUpload({ transport: () => new Promise(r => { resolve = r; }), onUploadComplete: callback }), { wrapper: StrictMode });
    let task!: Promise<UploadedImage | undefined>; act(() => { task = result.current.upload(file); }); unmount(); resolve(next); await task; expect(callback).not.toHaveBeenCalled();
  });
});
