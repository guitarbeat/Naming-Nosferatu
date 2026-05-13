import { describe, it, expect, vi, beforeEach } from "vitest";
import {
        readStoredUserSnapshot,
        writeStoredUserSnapshot,
        clearStoredUserSnapshot,
} from "./userStorage";
import { STORAGE_KEYS } from "@/shared/lib/constants";
import {
        isStorageAvailable,
        readStorageJson,
        removeStorageItem,
        setStorageString,
        writeStorageJson,
} from "@/shared/lib/storage";

vi.mock("@/shared/lib/storage", () => ({
        isStorageAvailable: vi.fn(),
        readStorageJson: vi.fn(),
        removeStorageItem: vi.fn(),
        setStorageString: vi.fn(),
        writeStorageJson: vi.fn(),
}));

describe("userStorage", () => {
        beforeEach(() => {
                vi.clearAllMocks();
                vi.mocked(isStorageAvailable).mockReturnValue(true);
        });

        describe("readStoredUserSnapshot", () => {
                it("returns null if storage is not available", () => {
                        vi.mocked(isStorageAvailable).mockReturnValue(false);
                        expect(readStoredUserSnapshot()).toBeNull();
                });

                it("returns null and clears storage if value is not an object", () => {
                        vi.mocked(readStorageJson).mockReturnValue("not an object");
                        expect(readStoredUserSnapshot()).toBeNull();
                        expect(removeStorageItem).toHaveBeenCalledWith(STORAGE_KEYS.USER_STORAGE);
                        expect(removeStorageItem).toHaveBeenCalledWith(STORAGE_KEYS.USER);
                        expect(removeStorageItem).toHaveBeenCalledWith(STORAGE_KEYS.USER_ID);
                        expect(removeStorageItem).toHaveBeenCalledWith(STORAGE_KEYS.USER_AVATAR);
                });

                it("returns null and clears storage if name is missing", () => {
                        vi.mocked(readStorageJson).mockReturnValue({ id: "123" });
                        expect(readStoredUserSnapshot()).toBeNull();
                        expect(removeStorageItem).toHaveBeenCalledWith(STORAGE_KEYS.USER_STORAGE);
                });

                it("returns null and clears storage if name is empty after trim", () => {
                        vi.mocked(readStorageJson).mockReturnValue({ name: "   " });
                        expect(readStoredUserSnapshot()).toBeNull();
                        expect(removeStorageItem).toHaveBeenCalledWith(STORAGE_KEYS.USER_STORAGE);
                });

                it("normalizes and returns valid snapshot with only name", () => {
                        vi.mocked(readStorageJson).mockReturnValue({ name: "Alice" });
                        expect(readStoredUserSnapshot()).toEqual({
                                name: "Alice",
                                id: undefined,
                                isAdmin: undefined,
                                avatarUrl: undefined,
                                email: undefined,
                        });
                        expect(removeStorageItem).not.toHaveBeenCalled();
                });

                it("normalizes and returns fully populated snapshot", () => {
                        vi.mocked(readStorageJson).mockReturnValue({
                                id: "123",
                                name: " Bob ",
                                isAdmin: true,
                                avatarUrl: "https://example.com/avatar.jpg",
                                email: "bob@example.com",
                                extra: "should be ignored",
                        });
                        expect(readStoredUserSnapshot()).toEqual({
                                id: "123",
                                name: "Bob",
                                isAdmin: true,
                                avatarUrl: "https://example.com/avatar.jpg",
                                email: "bob@example.com",
                        });
                        expect(removeStorageItem).not.toHaveBeenCalled();
                });

                it("handles null id correctly", () => {
                        vi.mocked(readStorageJson).mockReturnValue({
                                id: null,
                                name: "Charlie",
                        });
                        expect(readStoredUserSnapshot()).toEqual({
                                id: null,
                                name: "Charlie",
                                isAdmin: undefined,
                                avatarUrl: undefined,
                                email: undefined,
                        });
                });

                it("handles invalid types for optional fields", () => {
                        vi.mocked(readStorageJson).mockReturnValue({
                                name: "Dave",
                                id: 123, // should be string or null
                                isAdmin: "true", // should be boolean
                                avatarUrl: 456, // should be string
                                email: {}, // should be string
                        });
                        expect(readStoredUserSnapshot()).toEqual({
                                name: "Dave",
                                id: undefined,
                                isAdmin: undefined,
                                avatarUrl: undefined,
                                email: undefined,
                        });
                });
        });

        describe("writeStoredUserSnapshot", () => {
                it("does nothing if storage is not available", () => {
                        vi.mocked(isStorageAvailable).mockReturnValue(false);
                        writeStoredUserSnapshot({ name: "Alice" });
                        expect(writeStorageJson).not.toHaveBeenCalled();
                });

                it("clears storage if snapshot is null", () => {
                        writeStoredUserSnapshot(null);
                        expect(removeStorageItem).toHaveBeenCalledWith(STORAGE_KEYS.USER_STORAGE);
                        expect(removeStorageItem).toHaveBeenCalledWith(STORAGE_KEYS.USER);
                        expect(removeStorageItem).toHaveBeenCalledWith(STORAGE_KEYS.USER_ID);
                        expect(removeStorageItem).toHaveBeenCalledWith(STORAGE_KEYS.USER_AVATAR);
                });

                it("clears storage if normalized snapshot is invalid (missing name)", () => {
                        // @ts-expect-error Testing invalid input
                        writeStoredUserSnapshot({ id: "123" });
                        expect(removeStorageItem).toHaveBeenCalledWith(STORAGE_KEYS.USER_STORAGE);
                });

                it("writes minimal valid snapshot", () => {
                        writeStoredUserSnapshot({ name: "Alice" });
                        expect(writeStorageJson).toHaveBeenCalledWith(STORAGE_KEYS.USER_STORAGE, {
                                name: "Alice",
                                id: undefined,
                                isAdmin: undefined,
                                avatarUrl: undefined,
                                email: undefined,
                        });
                        expect(setStorageString).toHaveBeenCalledWith(STORAGE_KEYS.USER, "Alice");
                        expect(removeStorageItem).toHaveBeenCalledWith(STORAGE_KEYS.USER_ID);
                        expect(removeStorageItem).toHaveBeenCalledWith(STORAGE_KEYS.USER_AVATAR);
                });

                it("writes fully populated snapshot", () => {
                        writeStoredUserSnapshot({
                                id: "123",
                                name: " Bob ",
                                isAdmin: true,
                                avatarUrl: "https://example.com/avatar.jpg",
                                email: "bob@example.com",
                        });
                        expect(writeStorageJson).toHaveBeenCalledWith(STORAGE_KEYS.USER_STORAGE, {
                                id: "123",
                                name: "Bob",
                                isAdmin: true,
                                avatarUrl: "https://example.com/avatar.jpg",
                                email: "bob@example.com",
                        });
                        expect(setStorageString).toHaveBeenCalledWith(STORAGE_KEYS.USER, "Bob");
                        expect(setStorageString).toHaveBeenCalledWith(STORAGE_KEYS.USER_ID, "123");
                        expect(setStorageString).toHaveBeenCalledWith(
                                STORAGE_KEYS.USER_AVATAR,
                                "https://example.com/avatar.jpg",
                        );
                });
        });

        describe("clearStoredUserSnapshot", () => {
                it("does nothing if storage is not available", () => {
                        vi.mocked(isStorageAvailable).mockReturnValue(false);
                        clearStoredUserSnapshot();
                        expect(removeStorageItem).not.toHaveBeenCalled();
                });

                it("removes all user-related storage items", () => {
                        clearStoredUserSnapshot();
                        expect(removeStorageItem).toHaveBeenCalledWith(STORAGE_KEYS.USER);
                        expect(removeStorageItem).toHaveBeenCalledWith(STORAGE_KEYS.USER_ID);
                        expect(removeStorageItem).toHaveBeenCalledWith(STORAGE_KEYS.USER_AVATAR);
                        expect(removeStorageItem).toHaveBeenCalledWith(STORAGE_KEYS.USER_STORAGE);
                });
        });
});
