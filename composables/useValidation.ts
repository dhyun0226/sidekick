/**
 * 공통 Validation Composable
 *
 * 모든 input validation을 한 곳에서 관리합니다.
 */

export interface ValidationResult {
  valid: boolean
  message?: string
}

export const useValidation = () => {
  /**
   * 닉네임 검증
   * - 2~15자 (창의적인 닉네임 가능)
   * - 공백만으로 구성 불가
   */
  const validateNickname = (nickname: string): ValidationResult => {
    const trimmed = nickname.trim()

    if (trimmed.length === 0) {
      return { valid: false, message: '닉네임을 입력해주세요.' }
    }

    if (trimmed.length < 2) {
      return { valid: false, message: '닉네임은 2글자 이상이어야 합니다.' }
    }

    if (trimmed.length > 15) {
      return { valid: false, message: '닉네임은 15글자 이하여야 합니다.' }
    }

    return { valid: true }
  }

  /**
   * 그룹 이름 검증
   * - 2~20자 (모임 이름으로 충분)
   * - 공백만으로 구성 불가
   */
  const validateGroupName = (groupName: string): ValidationResult => {
    const trimmed = groupName.trim()

    if (trimmed.length === 0) {
      return { valid: false, message: '그룹 이름을 입력해주세요.' }
    }

    if (trimmed.length < 2) {
      return { valid: false, message: '그룹 이름은 2글자 이상이어야 합니다.' }
    }

    if (trimmed.length > 20) {
      return { valid: false, message: '그룹 이름은 20글자 이하여야 합니다.' }
    }

    return { valid: true }
  }

  /**
   * 댓글/답글 검증
   * - 1~500자
   * - 공백만으로 구성 불가
   */
  const validateComment = (content: string): ValidationResult => {
    const trimmed = content.trim()

    if (trimmed.length === 0) {
      return { valid: false, message: '내용을 입력해주세요.' }
    }

    if (trimmed.length > 500) {
      return { valid: false, message: '댓글은 500자 이하여야 합니다.' }
    }

    return { valid: true }
  }

  /**
   * 리뷰 내용 검증
   * - 10~2000자 (선택사항이면 0자 허용)
   * - 공백만으로 구성 불가
   */
  const validateReviewContent = (content: string, required: boolean = false): ValidationResult => {
    const trimmed = content.trim()

    if (trimmed.length === 0) {
      if (required) {
        return { valid: false, message: '리뷰 내용을 입력해주세요.' }
      }
      return { valid: true } // 선택사항이면 빈 값 허용
    }

    if (trimmed.length < 10) {
      return { valid: false, message: '리뷰는 10글자 이상 작성해주세요.' }
    }

    if (trimmed.length > 2000) {
      return { valid: false, message: '리뷰는 2000자 이하여야 합니다.' }
    }

    return { valid: true }
  }

  /**
   * 별점 검증
   * - 0.5~5.0 사이 (0.5 단위)
   * - 3.5, 4.5 등 지원
   */
  const validateRating = (rating: number): ValidationResult => {
    if (!rating || rating < 0.5 || rating > 5) {
      return { valid: false, message: '별점을 선택해주세요. (0.5~5점)' }
    }

    // 0.5 단위 체크
    if ((rating * 2) % 1 !== 0) {
      return { valid: false, message: '별점은 0.5 단위로 선택해주세요.' }
    }

    return { valid: true }
  }

  /**
   * 범용 텍스트 길이 검증
   */
  const validateLength = (
    text: string,
    minLength: number,
    maxLength: number,
    fieldName: string = '입력값'
  ): ValidationResult => {
    const trimmed = text.trim()

    if (trimmed.length === 0) {
      return { valid: false, message: `${fieldName}을(를) 입력해주세요.` }
    }

    if (trimmed.length < minLength) {
      return { valid: false, message: `${fieldName}은(는) ${minLength}글자 이상이어야 합니다.` }
    }

    if (trimmed.length > maxLength) {
      return { valid: false, message: `${fieldName}은(는) ${maxLength}글자 이하여야 합니다.` }
    }

    return { valid: true }
  }

  return {
    validateNickname,
    validateGroupName,
    validateComment,
    validateReviewContent,
    validateRating,
    validateLength
  }
}
